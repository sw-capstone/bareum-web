import { z } from 'zod';

export const severitySchema = z.enum(['high', 'medium', 'low', 'pending']);
export const issueStatusSchema = z.enum(['open', 'resolved', 'ignored']);

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
export const analysisProgressSchema = z.object({
  status: z.enum(['queued', 'processing', 'completed', 'failed']),
  progress: z.number().min(0).max(100),
  step: z.string(),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
});

export type AnalysisProgress = z.infer<typeof analysisProgressSchema>;
