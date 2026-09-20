"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeCode = executeCode;
const axios_1 = __importDefault(require("axios"));
// 10 seconds execution timeout
const MAX_EXECUTION_TIME_MS = 10000;
// 64 KB maximum output size
const MAX_OUTPUT_BYTES = 64 * 1024;
// Default endpoint (can be overridden via environment variable for self-hosted instances)
const PISTON_API_URL = process.env.PISTON_API_URL || 'https://emkc.org/api/v2/piston/execute';
const SUPPORTED_LANGUAGES = {
    python: { pistonLanguage: 'python', defaultVersion: '3.10.0', filename: 'solution.py' },
    py: { pistonLanguage: 'python', defaultVersion: '3.10.0', filename: 'solution.py' },
    javascript: { pistonLanguage: 'javascript', defaultVersion: '18.15.0', filename: 'solution.js' },
    js: { pistonLanguage: 'javascript', defaultVersion: '18.15.0', filename: 'solution.js' },
    typescript: { pistonLanguage: 'typescript', defaultVersion: '5.0.3', filename: 'solution.ts' },
    ts: { pistonLanguage: 'typescript', defaultVersion: '5.0.3', filename: 'solution.ts' },
    java: { pistonLanguage: 'java', defaultVersion: '15.0.2', filename: 'Solution.java' },
    cpp: { pistonLanguage: 'c++', defaultVersion: '10.2.0', filename: 'solution.cpp' },
    'c++': { pistonLanguage: 'c++', defaultVersion: '10.2.0', filename: 'solution.cpp' },
    c: { pistonLanguage: 'c', defaultVersion: '10.2.0', filename: 'solution.c' },
    go: { pistonLanguage: 'go', defaultVersion: '1.16.2', filename: 'solution.go' },
    golang: { pistonLanguage: 'go', defaultVersion: '1.16.2', filename: 'solution.go' },
};
/**
 * Truncates output to MAX_OUTPUT_BYTES (64KB) if exceeded.
 */
function truncateOutput(text) {
    if (!text)
        return { content: '', wasTruncated: false };
    const buffer = Buffer.from(text, 'utf-8');
    if (buffer.length <= MAX_OUTPUT_BYTES) {
        return { content: text, wasTruncated: false };
    }
    const truncatedSlice = buffer.subarray(0, MAX_OUTPUT_BYTES).toString('utf-8');
    return {
        content: `${truncatedSlice}\n\n[Warning: Output exceeded 64KB limit and was truncated]`,
        wasTruncated: true,
    };
}
/**
 * Executes user code safely via the Piston API sandbox.
 * Never executes user code on the Express server or passes to shell commands directly.
 */
async function executeCode(params) {
    const { language, version, code, stdin } = params;
    if (!language || typeof language !== 'string') {
        return {
            stdout: '',
            stderr: 'Error: Language parameter is required.',
            exitCode: 1,
            executionTimeMs: 0,
        };
    }
    if (typeof code !== 'string' || !code.trim()) {
        return {
            stdout: '',
            stderr: 'Error: Code cannot be empty.',
            exitCode: 1,
            executionTimeMs: 0,
        };
    }
    const normalizedLang = language.toLowerCase().trim();
    const langConfig = SUPPORTED_LANGUAGES[normalizedLang];
    if (!langConfig) {
        const supportedList = Array.from(new Set(Object.values(SUPPORTED_LANGUAGES).map(l => l.pistonLanguage))).join(', ');
        return {
            stdout: '',
            stderr: `Error: Unsupported language '${language}'. Supported languages: ${supportedList}`,
            exitCode: 1,
            executionTimeMs: 0,
        };
    }
    const targetVersion = version || langConfig.defaultVersion;
    const startTime = Date.now();
    try {
        const response = await axios_1.default.post(PISTON_API_URL, {
            language: langConfig.pistonLanguage,
            version: targetVersion,
            files: [
                {
                    name: langConfig.filename,
                    content: code,
                },
            ],
            stdin: typeof stdin === 'string' ? stdin : '',
            run_timeout: MAX_EXECUTION_TIME_MS,
        }, {
            timeout: MAX_EXECUTION_TIME_MS + 2000, // extra 2s buffer for network roundtrip
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });
        const executionTimeMs = Date.now() - startTime;
        const runData = response.data?.run || {};
        const rawStdout = typeof runData.stdout === 'string' ? runData.stdout : '';
        const rawStderr = typeof runData.stderr === 'string' ? runData.stderr : '';
        const { content: stdout, wasTruncated: stdoutTruncated } = truncateOutput(rawStdout);
        const { content: stderr, wasTruncated: stderrTruncated } = truncateOutput(rawStderr);
        // If Piston signaled timeout
        if (runData.signal === 'SIGKILL' || runData.signal === 'SIGTERM') {
            return {
                stdout,
                stderr: `${stderr}\nExecution timed out (10 seconds limit exceeded). Check for infinite loops.`.trim(),
                exitCode: 124,
                executionTimeMs,
                truncated: stdoutTruncated || stderrTruncated,
            };
        }
        const exitCode = typeof runData.code === 'number' ? runData.code : 0;
        return {
            stdout,
            stderr,
            exitCode,
            executionTimeMs,
            truncated: stdoutTruncated || stderrTruncated,
        };
    }
    catch (error) {
        const executionTimeMs = Date.now() - startTime;
        // 1. Timeout handling
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
            return {
                stdout: '',
                stderr: 'Execution timed out (10 seconds limit exceeded). Check for infinite loops or long-running operations.',
                exitCode: 124,
                executionTimeMs,
            };
        }
        // 2. Network / Piston service downtime
        console.error('[CodeExecutor] Piston API error:', error.response?.data || error.message);
        const serverDetails = error.response?.data?.message || error.message || 'Service unreachable';
        return {
            stdout: '',
            stderr: `Execution service is currently unavailable. (${serverDetails})\nPlease try again in a few moments.`,
            exitCode: 503,
            executionTimeMs,
        };
    }
}
