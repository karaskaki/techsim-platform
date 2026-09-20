import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { requirePlan, checkLimit } from '../middleware/planGuard';
import { callAI } from '../lib/ai';
import { LLDProblem, LLDSubmission, LLDProgress } from '../models/lldSubmission';

const router = Router();

// Piston API Configuration
const PISTON_API_URL = process.env.PISTON_API_URL || 'https://emkc.org/api/v2/piston/execute';

const PISTON_LANGUAGE_MAP: Record<string, { language: string; version: string }> = {
  python: { language: 'python', version: '3.10.0' },
  javascript: { language: 'javascript', version: '18.15.0' },
  java: { language: 'java', version: '15.0.2' },
  cpp: { language: 'c++', version: '10.2.0' },
};

// ── 1. GET /api/lld/problems ────────────────────────────────────────────────
// List problems with optional filtering by pattern, difficulty, and search term
router.get('/problems', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pattern, difficulty, search } = req.query;

    const query: Record<string, any> = {};

    if (difficulty && typeof difficulty === 'string' && ['easy', 'medium', 'hard'].includes(difficulty.toLowerCase())) {
      query.difficulty = difficulty.toLowerCase();
    }

    if (pattern && typeof pattern === 'string' && pattern.trim()) {
      query.patternTags = { $regex: new RegExp(`^${pattern.trim()}$`, 'i') };
    }

    if (search && typeof search === 'string' && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { patternTags: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const problems = await LLDProblem.find(query)
      .select('-referenceSolution')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: problems.length,
      problems,
    });
  } catch (error) {
    next(error);
  }
});

// ── 2. GET /api/lld/problems/:slug ──────────────────────────────────────────
// Get single problem by slug, excluding hidden referenceSolution
router.get('/problems/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawSlug = req.params.slug;
    const slug = (Array.isArray(rawSlug) ? rawSlug[0] : rawSlug || '').toLowerCase();

    const problem = await LLDProblem.findOne({ slug }).select('-referenceSolution');
    if (!problem) {
      return res.status(404).json({ error: `Problem with slug '${slug}' not found` });
    }

    return res.status(200).json(problem);
  } catch (error) {
    next(error);
  }
});

// ── 3. POST /api/lld/submissions ────────────────────────────────────────────
// Save/update code submission or draft without executing
router.post('/submissions', authMiddleware, requirePlan('free'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { problemId, language, code, status } = req.body;

    if (!problemId || !language || typeof code !== 'string') {
      return res.status(400).json({ error: 'problemId, language, and code are required' });
    }

    const validLanguages = ['python', 'java', 'cpp', 'javascript'];
    if (!validLanguages.includes(language)) {
      return res.status(400).json({ error: `language must be one of: ${validLanguages.join(', ')}` });
    }

    const validStatuses = ['draft', 'submitted', 'passed', 'failed'];
    const submissionStatus = status && validStatuses.includes(status) ? status : 'draft';

    // Verify problem exists
    const problem = await LLDProblem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Upsert or create submission for this user and problem
    let submission = await LLDSubmission.findOne({
      userId: req.user.userId,
      problemId: problem._id,
    });

    if (submission) {
      submission.language = language;
      submission.code = code;
      submission.status = submissionStatus;
      await submission.save();
    } else {
      submission = new LLDSubmission({
        userId: req.user.userId,
        problemId: problem._id,
        language,
        code,
        status: submissionStatus,
      });
      await submission.save();
    }

    return res.status(200).json(submission);
  } catch (error) {
    next(error);
  }
});

// ── 4. POST /api/lld/execute ────────────────────────────────────────────────
// Proxies code execution securely to Piston API (never executes on Express server)
router.post('/execute', authMiddleware, requirePlan('free'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { language, code, stdin } = req.body;

    if (!language || typeof code !== 'string') {
      return res.status(400).json({ error: 'language and code are required' });
    }

    const pistonConfig = PISTON_LANGUAGE_MAP[language.toLowerCase()];
    if (!pistonConfig) {
      return res.status(400).json({
        error: `Unsupported execution language: ${language}. Supported languages: ${Object.keys(PISTON_LANGUAGE_MAP).join(', ')}`,
      });
    }

    if (!code.trim()) {
      return res.status(400).json({ error: 'Code cannot be empty' });
    }

    // Proxy request to Piston sandboxed runner
    const startTime = Date.now();
    try {
      const pistonResponse = await axios.post(
        PISTON_API_URL,
        {
          language: pistonConfig.language,
          version: pistonConfig.version,
          files: [
            {
              name: language === 'java' ? 'Solution.java' : undefined,
              content: code,
            },
          ],
          stdin: typeof stdin === 'string' ? stdin : '',
        },
        {
          timeout: 12000,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const runtimeMs = Date.now() - startTime;
      const runResult = pistonResponse.data?.run || {};

      return res.status(200).json({
        stdout: runResult.stdout || '',
        stderr: runResult.stderr || '',
        exitCode: typeof runResult.code === 'number' ? runResult.code : 0,
        output: runResult.output || '',
        runtime: runtimeMs,
      });
    } catch (pistonError: any) {
      const runtimeMs = Date.now() - startTime;
      if (pistonError.code === 'ECONNABORTED' || pistonError.message?.includes('timeout')) {
        return res.status(408).json({
          error: 'Code execution timed out (limit: 12 seconds). Check for infinite loops or long-running operations.',
          runtime: runtimeMs,
        });
      }

      console.error('[LLD Execute] Piston API error:', pistonError.response?.data || pistonError.message);
      return res.status(502).json({
        error: 'Execution service temporarily unavailable. Please try again in a few moments.',
        details: pistonError.response?.data?.message || pistonError.message,
      });
    }
  } catch (error) {
    next(error);
  }
});

// ── 5. POST /api/lld/ai-review ──────────────────────────────────────────────
// Evaluates LLD code with AI against SOLID principles, design patterns, and clean architecture
router.post('/ai-review', authMiddleware, checkLimit('aiGenerationsPerDay'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { problemTitle, problemDescription, language, code, submissionId } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Code is required for AI design review' });
    }

    const groqKey = req.headers['x-groq-api-key'] as string | undefined;
    const geminiKey = req.headers['x-gemini-api-key'] as string | undefined;

    const systemPrompt = `You are a Principal Software Architect and Staff Engineer with 15+ years of experience in Low-Level Design (LLD), Object-Oriented Analysis and Design (OOAD), SOLID principles, and Gang of Four (GoF) design patterns.

Your goal is to evaluate the user's LLD solution thoroughly, objectively, and constructively.

Structure your review in clean Markdown with the following sections:
1. **Executive Summary & Design Score**: Brief overview (1-2 sentences) and an overall score out of 10 for Design, Extensibility, and Clean Code.
2. **SOLID Principles Assessment**:
   - Single Responsibility Principle (SRP)
   - Open/Closed Principle (OCP)
   - Liskov Substitution Principle (LSP)
   - Interface Segregation Principle (ISP)
   - Dependency Inversion Principle (DIP)
3. **Design Patterns Used & Evaluation**: Identify which patterns are implemented (e.g. Factory, Strategy, Observer, Singleton, Decorator, State). Are they applied correctly or is there over-engineering / missing abstraction?
4. **Code Quality & Modularity**: Evaluation of class cohesion, coupling, naming conventions, error handling, and thread-safety if applicable.
5. **Key Recommendations & Refactored Snippet**: Concrete, actionable refactoring advice with a concise code example demonstrating the suggested improvement.

Be direct, technical, and constructive. Avoid fluff.`;

    const userPrompt = `Please review this Low-Level Design implementation:

Problem: ${problemTitle || 'General LLD Exercise'}
${problemDescription ? `Problem Statement:\n${problemDescription}\n` : ''}
Language: ${language || 'Unknown'}

User Code:
\`\`\`${language || 'text'}
${code}
\`\`\`
`;

    const review = await callAI(userPrompt, systemPrompt, 1600, groqKey, geminiKey);

    // If a submissionId was provided, attach the AI review to the submission
    if (submissionId) {
      await LLDSubmission.findByIdAndUpdate(submissionId, { aiReview: review });
    }

    return res.status(200).json({ review });
  } catch (error) {
    next(error);
  }
});

// ── 6. GET /api/lld/progress ────────────────────────────────────────────────
// Retrieve user's LLD roadmap and challenge progress
router.get('/progress', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let progress = await LLDProgress.findOne({ userId: req.user.userId }).populate('completedProblems', 'title slug difficulty patternTags');

    if (!progress) {
      progress = await LLDProgress.create({
        userId: req.user.userId,
        completedProblems: [],
        currentRoadmapStep: 0,
        solidPrincipleQuizScores: {},
      });
    }

    return res.status(200).json(progress);
  } catch (error) {
    next(error);
  }
});

// ── 7. POST /api/lld/progress ───────────────────────────────────────────────
// Update user's completed problems, roadmap step, or SOLID quiz scores
router.post('/progress', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { completedProblemId, currentRoadmapStep, solidPrincipleQuizScore } = req.body;

    let progress = await LLDProgress.findOne({ userId: req.user.userId });
    if (!progress) {
      progress = new LLDProgress({
        userId: req.user.userId,
        completedProblems: [],
        currentRoadmapStep: 0,
        solidPrincipleQuizScores: new Map(),
      });
    }

    if (completedProblemId) {
      const alreadyCompleted = progress.completedProblems.some(
        (id) => id.toString() === completedProblemId.toString()
      );
      if (!alreadyCompleted) {
        progress.completedProblems.push(completedProblemId);
      }
    }

    if (typeof currentRoadmapStep === 'number') {
      progress.currentRoadmapStep = currentRoadmapStep;
    }

    if (solidPrincipleQuizScore && typeof solidPrincipleQuizScore.principle === 'string' && typeof solidPrincipleQuizScore.score === 'number') {
      if (!progress.solidPrincipleQuizScores) {
        progress.solidPrincipleQuizScores = {} as any;
      }
      (progress.solidPrincipleQuizScores as any).set(
        solidPrincipleQuizScore.principle,
        solidPrincipleQuizScore.score
      );
    }

    await progress.save();
    await progress.populate('completedProblems', 'title slug difficulty patternTags');

    return res.status(200).json(progress);
  } catch (error) {
    next(error);
  }
});

export default router;
