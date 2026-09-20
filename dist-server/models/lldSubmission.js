"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLDProgress = exports.LLDSubmission = exports.LLDProblem = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const LLDProblemSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium', index: true },
    patternTags: [{ type: String, trim: true, index: true }],
    starterCode: {
        python: { type: String, default: '# Write your Python solution here\n' },
        java: { type: String, default: '// Write your Java solution here\npublic class Solution {\n    \n}\n' },
        cpp: { type: String, default: '// Write your C++ solution here\n#include <iostream>\n\nclass Solution {\n    \n};\n' },
        javascript: { type: String, default: '// Write your JavaScript solution here\n' },
    },
    referenceSolution: { type: String, select: false },
    externalLinks: [
        {
            label: { type: String, required: true },
            url: { type: String, required: true },
        },
    ],
}, { timestamps: true });
const LLDSubmissionSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    problemId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'LLDProblem', required: true, index: true },
    language: {
        type: String,
        enum: ['python', 'java', 'cpp', 'javascript'],
        required: true,
        default: 'python',
    },
    code: { type: String, required: true },
    status: {
        type: String,
        enum: ['draft', 'submitted', 'passed', 'failed'],
        default: 'draft',
        index: true,
    },
    aiReview: { type: String, default: '' },
}, { timestamps: true });
LLDSubmissionSchema.index({ userId: 1, problemId: 1 });
const LLDProgressSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    completedProblems: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'LLDProblem' }],
    currentRoadmapStep: { type: Number, default: 0 },
    solidPrincipleQuizScores: { type: Map, of: Number, default: () => new Map() },
}, { timestamps: true });
exports.LLDProblem = mongoose_1.default.model('LLDProblem', LLDProblemSchema);
exports.LLDSubmission = mongoose_1.default.model('LLDSubmission', LLDSubmissionSchema);
exports.LLDProgress = mongoose_1.default.model('LLDProgress', LLDProgressSchema);
