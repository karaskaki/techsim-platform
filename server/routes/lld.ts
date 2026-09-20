import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { requirePlan, checkLimit } from '../middleware/planGuard';
import { executionLimiter, aiLimiter } from '../middleware/rateLimiter';
import { generateLLDProblem, reviewLLDSubmission } from '../lib/ai';
import { executeCode } from '../lib/codeExecutor';
import { LLDProblem, LLDSubmission, LLDProgress } from '../models/lldSubmission';

const router = Router();

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

    const validLanguages = ['python', 'java', 'cpp', 'javascript', 'go', 'typescript'];
    if (!validLanguages.includes(language.toLowerCase())) {
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
// Proxies code execution securely via codeExecutor to Piston sandbox API
router.post('/execute', authMiddleware, requirePlan('free'), executionLimiter, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { language, version, code, stdin } = req.body;

    if (!language || typeof code !== 'string') {
      return res.status(400).json({ error: 'language and code are required' });
    }

    if (!code.trim()) {
      return res.status(400).json({ error: 'Code cannot be empty' });
    }

    const result = await executeCode({
      language,
      version,
      code,
      stdin,
    });

    return res.status(200).json({
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      executionTimeMs: result.executionTimeMs,
      runtime: result.executionTimeMs,
      output: result.stdout || result.stderr,
      truncated: result.truncated,
    });
  } catch (error) {
    next(error);
  }
});

// ── 5. POST /api/lld/ai-generate ────────────────────────────────────────────
// Generates an LLD problem with requirements, starter code, and patterns using AI
router.post('/ai-generate', authMiddleware, checkLimit('aiGenerationsPerDay'), aiLimiter, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { topic, difficulty = 'medium', saveToDb = false } = req.body;

    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return res.status(400).json({ error: 'Topic is required to generate an LLD problem' });
    }

    const groqKey = req.headers['x-groq-api-key'] as string | undefined;
    const geminiKey = req.headers['x-gemini-api-key'] as string | undefined;

    const generatedProblem = await generateLLDProblem(topic.trim(), difficulty, groqKey, geminiKey);

    if (saveToDb) {
      const problem = await LLDProblem.findOneAndUpdate(
        { slug: generatedProblem.slug },
        generatedProblem,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return res.status(201).json({ problem });
    }

    return res.status(200).json({ problem: generatedProblem });
  } catch (error) {
    next(error);
  }
});

// ── 6. POST /api/lld/ai-review ──────────────────────────────────────────────
// Evaluates LLD code with AI against SOLID principles, design patterns, and clean architecture
// Supports real-time streaming SSE when stream=true or Accept: text/event-stream
router.post('/ai-review', authMiddleware, checkLimit('aiGenerationsPerDay'), aiLimiter, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { problemTitle, problemDescription, language, code, submissionId, stream } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Code is required for AI design review' });
    }

    const groqKey = req.headers['x-groq-api-key'] as string | undefined;
    const geminiKey = req.headers['x-gemini-api-key'] as string | undefined;

    const isStreaming = stream === true || req.headers.accept?.includes('text/event-stream');

    if (isStreaming) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      if (typeof (res as any).flushHeaders === 'function') {
        (res as any).flushHeaders();
      }

      let fullReview = '';
      try {
        fullReview = await reviewLLDSubmission(
          code,
          language || 'python',
          { title: problemTitle, description: problemDescription },
          (chunk: string) => {
            res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
          },
          groqKey,
          geminiKey
        );

        if (submissionId) {
          await LLDSubmission.findByIdAndUpdate(submissionId, { aiReview: fullReview }).catch(() => {});
        }

        res.write('data: [DONE]\n\n');
        res.end();
      } catch (streamError: any) {
        res.write(`data: ${JSON.stringify({ error: streamError.message || 'Stream error' })}\n\n`);
        res.end();
      }
      return;
    }

    // Non-streaming fallback
    const review = await reviewLLDSubmission(
      code,
      language || 'python',
      { title: problemTitle, description: problemDescription },
      undefined,
      groqKey,
      geminiKey
    );

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
