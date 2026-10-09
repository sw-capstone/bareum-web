import { z } from 'zod';

export const severitySchema = z.enum(['high', 'medium', 'low', 'pending']);
export const issueStatusSchema = z.enum(['open', 'resolved', 'ignored']);
export const userSchema = z.object({ name: z.string().min(1), email: z.string().email() });
export const loginResponseSchema = z.object({ user: userSchema });
export const sendVerificationResponseSchema = z.object({
  expiresIn: z.number().int().positive(),
});
export const verifyEmailResponseSchema = z.object({
  verificationToken: z.string().min(1),
});

const evidenceSchema = z.object({ source: z.string(), quote: z.string() });
const segmentSchema = z.object({
  text: z.string(),
  issueId: z.string().optional(),
  level: severitySchema.optional(),
});
const issueSchema = z.object({
  id: z.string(),
  level: severitySchema,
  status: issueStatusSchema,
  sectionId: z.string(),
  section: z.string(),
  title: z.string(),
  summary: z.string(),
  original: z.string(),
  suggestion: z.string(),
  explanation: z.string(),
  evidence: z.array(evidenceSchema),
});

export const analysisResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  filename: z.string(),
  reviewedAt: z.string(),
  score: z.number().min(0).max(100),
  grade: z.string(),
  sections: z.array(
    z.object({
      id: z.string(),
      number: z.number(),
      title: z.string(),
      paragraphs: z.array(z.array(segmentSchema)),
    }),
  ),
  issues: z.array(issueSchema),
});

export const startAnalysisResponseSchema = z.object({ analysisId: z.string() });
export const analysisCheckSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
  failedAt: z.string().optional(),
});
export const analysisProgressSchema = z.object({
  status: z.enum([
    'queued',
    'processing',
    'paused',
    'completed',
    'partial_failed',
    'failed',
    'canceled',
  ]),
  progress: z.number().min(0).max(100),
  step: z.string(),
  filename: z.string().optional(),
  documentType: z.string().optional(),
  checks: z.array(analysisCheckSchema).optional(),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
});

export type AnalysisCheck = z.infer<typeof analysisCheckSchema>;
export type AnalysisProgress = z.infer<typeof analysisProgressSchema>;
