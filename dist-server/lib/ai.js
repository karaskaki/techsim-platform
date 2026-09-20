"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.callAI = callAI;
exports.callAIStream = callAIStream;
exports.generateLLDProblem = generateLLDProblem;
exports.reviewLLDSubmission = reviewLLDSubmission;
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const generative_ai_1 = require("@google/generative-ai");
function extractJSON(text) {
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    let start = -1;
    let end = -1;
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        start = firstBrace;
        end = text.lastIndexOf('}');
    }
    else if (firstBracket !== -1) {
        start = firstBracket;
        end = text.lastIndexOf(']');
    }
    if (start !== -1 && end !== -1 && end > start) {
        return text.substring(start, end + 1);
    }
    return text;
}
/**
 * Standard non-streaming AI completion using Groq with Gemini fallback.
 */
async function callAI(userPrompt, systemPrompt, maxTokens = 1000, customGroqKey, customGeminiKey) {
    const groqKey = customGroqKey || process.env.GROQ_API_KEY;
    const geminiKey = customGeminiKey || process.env.GEMINI_API_KEY;
    const provider = groqKey ? 'Groq' : 'Gemini';
    console.log(`[AI] Calling ${provider}, maxTokens: ${maxTokens}`);
    if (!groqKey && !geminiKey) {
        throw new Error('No Groq or Gemini API key configured on server or client');
    }
    let lastError = null;
    // Try Groq first if key is available
    if (groqKey) {
        try {
            const groqClient = new groq_sdk_1.default({ apiKey: groqKey });
            const completion = await groqClient.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                max_tokens: maxTokens,
                temperature: 0.3,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
            });
            return completion.choices[0].message.content || '';
        }
        catch (groqError) {
            console.warn('Groq failed, trying Gemini fallback:', groqError);
            lastError = groqError instanceof Error ? groqError : new Error(String(groqError));
        }
    }
    // Gemini fallback
    if (geminiKey) {
        try {
            const genAI = new generative_ai_1.GoogleGenerativeAI(geminiKey);
            const model = genAI.getGenerativeModel({
                model: 'gemini-3.5-flash',
                systemInstruction: systemPrompt,
            });
            const result = await model.generateContent(userPrompt);
            return result.response.text();
        }
        catch (geminiError) {
            console.error('Gemini fallback failed:', geminiError);
            lastError = geminiError instanceof Error ? geminiError : new Error(String(geminiError));
        }
    }
    throw lastError || new Error('No Groq or Gemini API key configured on server or client');
}
/**
 * Streaming AI completion using Groq with Gemini fallback.
 * Calls onChunk as each delta arrives and returns the full accumulated text.
 */
async function callAIStream(userPrompt, systemPrompt, maxTokens = 2000, onChunk, customGroqKey, customGeminiKey) {
    const groqKey = customGroqKey || process.env.GROQ_API_KEY;
    const geminiKey = customGeminiKey || process.env.GEMINI_API_KEY;
    if (!groqKey && !geminiKey) {
        throw new Error('No Groq or Gemini API key configured on server or client');
    }
    let accumulated = '';
    let lastError = null;
    // Try Groq streaming first
    if (groqKey) {
        try {
            const groqClient = new groq_sdk_1.default({ apiKey: groqKey });
            const stream = await groqClient.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                max_tokens: maxTokens,
                temperature: 0.3,
                stream: true,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
            });
            for await (const chunk of stream) {
                const delta = chunk.choices[0]?.delta?.content || '';
                if (delta) {
                    accumulated += delta;
                    onChunk(delta);
                }
            }
            return accumulated;
        }
        catch (groqError) {
            console.warn('Groq streaming failed, trying Gemini fallback:', groqError);
            lastError = groqError instanceof Error ? groqError : new Error(String(groqError));
        }
    }
    // Gemini streaming fallback
    if (geminiKey) {
        try {
            const genAI = new generative_ai_1.GoogleGenerativeAI(geminiKey);
            const model = genAI.getGenerativeModel({
                model: 'gemini-3.5-flash',
                systemInstruction: systemPrompt,
            });
            const responseStream = await model.generateContentStream(userPrompt);
            for await (const chunk of responseStream.stream) {
                const text = chunk.text();
                if (text) {
                    accumulated += text;
                    onChunk(text);
                }
            }
            return accumulated;
        }
        catch (geminiError) {
            console.error('Gemini streaming fallback failed:', geminiError);
            lastError = geminiError instanceof Error ? geminiError : new Error(String(geminiError));
        }
    }
    throw lastError || new Error('No Groq or Gemini API key configured on server or client');
}
/**
 * 1. Generates a structured LLD problem statement with requirements, edge cases,
 * and expected class relationships matching the LLDProblem schema.
 */
async function generateLLDProblem(topic, difficulty = 'medium', customGroqKey, customGeminiKey) {
    const systemPrompt = `You are a Principal Software Architect and Staff Engineer responsible for designing technical interview problems for Low-Level Design (LLD).
Generate a deep, realistic, industry-standard LLD problem based on the provided topic and difficulty.

Return ONLY valid raw JSON with this exact schema (no markdown, no backticks, no wrapping text):
{
  "title": "string (clear descriptive problem title)",
  "slug": "string (lowercase-kebab-case)",
  "description": "string (Markdown formatted text with: ## Problem Overview, ### Requirements, ### Edge Cases & Constraints, and ### Expected Class Relationships)",
  "difficulty": "easy" | "medium" | "hard",
  "patternTags": ["string" (e.g. "Factory", "Strategy", "Observer", "Singleton", "Decorator", "State")],
  "starterCode": {
    "python": "string (clean starter code with abstract classes/enums/interfaces)",
    "java": "string (clean starter code with interfaces/enums/class skeleton)",
    "cpp": "string (clean starter code with classes/virtual methods)",
    "javascript": "string (clean starter code with ES6 classes)"
  },
  "referenceSolution": "string (complete reference solution in Python or Java)",
  "externalLinks": [
    { "label": "string", "url": "string" }
  ]
}`;
    const userPrompt = `Generate a comprehensive Low-Level Design problem for topic: "${topic}" at difficulty level: "${difficulty}".`;
    const raw = await callAI(userPrompt, systemPrompt, 3500, customGroqKey, customGeminiKey);
    const cleaned = extractJSON(raw);
    return JSON.parse(cleaned);
}
/**
 * 2. Reviews an LLD code submission from a Staff Engineer perspective,
 * evaluating SOLID principles, design patterns, extensibility, and readability.
 * Optionally streams review chunks to onChunk for responsive live feedback.
 */
async function reviewLLDSubmission(code, language, problemContext, onChunk, customGroqKey, customGeminiKey) {
    const systemPrompt = `You are a Principal Staff Software Engineer and System Architect conducting an in-depth Low-Level Design (LLD) code review.
Your goal is to evaluate the code specifically for:
1. **SOLID Principles Adherence**: Identify any violations of SRP, OCP, LSP, ISP, or DIP. Explicitly tag which principle is violated and why.
2. **Design Pattern Implementation**: Are patterns (Factory, Strategy, Observer, Decorator, State, Builder, etc.) implemented cleanly, or is there over-engineering / anti-pattern?
3. **Extensibility & Modularity**: How easily can new features or types be added without modifying existing classes?
4. **Naming & Readability**: Class cohesion, coupling, variable/method naming, and separation of concerns.
Do NOT just check "does it compile". Evaluate the design architecture.

Structure your review in clean Markdown with these sections:
## 1. Executive Summary & Design Score (out of 10)
## 2. Strengths
## 3. SOLID Principle Violations & Pattern Critique
(Format as: - **[PRINCIPLE_OR_PATTERN]**: Specific issue in code and how to address it)
## 4. Extensibility & Class Cohesion Analysis
## 5. Concrete Refactoring Recommendations (with clean code snippet)`;
    const userPrompt = `Please review this Low-Level Design submission:

Problem Title: ${problemContext.title || 'LLD Exercise'}
${problemContext.description ? `Problem Statement:\n${problemContext.description}\n` : ''}
Language: ${language}

Submitted Code:
\`\`\`${language}
${code}
\`\`\`
`;
    if (onChunk) {
        return callAIStream(userPrompt, systemPrompt, 2500, onChunk, customGroqKey, customGeminiKey);
    }
    else {
        return callAI(userPrompt, systemPrompt, 2500, customGroqKey, customGeminiKey);
    }
}
