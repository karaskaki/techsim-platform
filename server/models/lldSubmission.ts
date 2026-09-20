import mongoose, { Schema, Document, Types } from 'mongoose';

// ── 1. LLD Problem ───────────────────────────────────────────────────────────
export interface ILLDProblem extends Document {
  title: string;
  slug: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  patternTags: string[];
  starterCode: {
    python: string;
    java: string;
    cpp: string;
    javascript: string;
  };
  referenceSolution?: string;
  externalLinks: Array<{ label: string; url: string }>;
  createdAt: Date;
  updatedAt: Date;
}

const LLDProblemSchema = new Schema<ILLDProblem>(
  {
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
  },
  { timestamps: true }
);

// ── 2. LLD Submission ────────────────────────────────────────────────────────
export interface ILLDSubmission extends Document {
  userId: Types.ObjectId;
  problemId: Types.ObjectId;
  language: 'python' | 'java' | 'cpp' | 'javascript';
  code: string;
  status: 'draft' | 'submitted' | 'passed' | 'failed';
  aiReview?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LLDSubmissionSchema = new Schema<ILLDSubmission>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    problemId: { type: Schema.Types.ObjectId, ref: 'LLDProblem', required: true, index: true },
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
  },
  { timestamps: true }
);

LLDSubmissionSchema.index({ userId: 1, problemId: 1 });

// ── 3. LLD Progress ──────────────────────────────────────────────────────────
export interface ILLDProgress extends Document {
  userId: Types.ObjectId;
  completedProblems: Types.ObjectId[];
  currentRoadmapStep: number;
  solidPrincipleQuizScores: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const LLDProgressSchema = new Schema<ILLDProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    completedProblems: [{ type: Schema.Types.ObjectId, ref: 'LLDProblem' }],
    currentRoadmapStep: { type: Number, default: 0 },
    solidPrincipleQuizScores: { type: Map, of: Number, default: () => new Map() },
  },
  { timestamps: true }
);

export const LLDProblem = mongoose.model<ILLDProblem>('LLDProblem', LLDProblemSchema);
export const LLDSubmission = mongoose.model<ILLDSubmission>('LLDSubmission', LLDSubmissionSchema);
export const LLDProgress = mongoose.model<ILLDProgress>('LLDProgress', LLDProgressSchema);
