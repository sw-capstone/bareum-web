import { env } from '../config/env';
import type { AnalysisResult, Severity } from '../types';

export interface ResultReport {
  score: number;
  grade: string;
  reviewedAt: string;
  issueCounts: Record<Severity, number>;
  findings: { id: string; title: string; explanation: string; suggestion: string }[];
}

export class ResultReportUnavailableError extends Error {}

export const resultReportApi = {
  async get(analysisId: string, result: AnalysisResult): Promise<ResultReport> {
    if (!env.useMockApi) {
      throw new ResultReportUnavailableError('결과 리포트 조회 API가 아직 연결되지 않았습니다.');
    }
    if (analysisId !== result.id) throw new Error('분석 결과와 리포트가 일치하지 않습니다.');
    return {
      score: result.score,
      grade: result.grade,
      reviewedAt: result.reviewedAt,
      issueCounts: result.issues.reduce<Record<Severity, number>>(
        (counts, issue) => {
          counts[issue.level] += 1;
          return counts;
        },
        { high: 0, medium: 0, low: 0, pending: 0 },
      ),
      findings: result.issues.map((issue) => ({
        id: issue.id,
        title: issue.title,
        explanation: issue.explanation,
        suggestion: issue.level === 'pending' ? '' : issue.suggestion,
      })),
    };
  },
};
