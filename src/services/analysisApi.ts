import { env } from '../config/env';
import { sampleResult } from '../mocks/analysis';
import type { AnalysisResult, IssueStatus } from '../types';
import {
  analysisProgressSchema,
  analysisResultSchema,
  startAnalysisResponseSchema,
  type AnalysisProgress,
} from './contracts';
import { request } from './httpClient';

export interface AnalysisRequest {
  file?: File;
  text?: string;
  documentType: string;
}

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      window.clearTimeout(timer);
      reject(new DOMException('요청이 취소되었습니다.', 'AbortError'));
    });
  });

let mockProgress = 0;
let mockPaused = false;
const mockCheckLabels = ['구조', '규정', '표현', '정합성', '수정안', '점수'];

function createMockChecks(progress: number) {
  const completedCount = Math.floor((progress / 100) * mockCheckLabels.length);
  return mockCheckLabels.map((label, index) => ({
    id: label,
    label,
    status: (index < completedCount
      ? 'completed'
      : index === completedCount && progress < 100
        ? 'processing'
        : 'pending') as 'completed' | 'processing' | 'pending',
  }));
}

export const analysisApi = {
  async start(input: AnalysisRequest, signal?: AbortSignal) {
    if (env.useMockApi) {
      mockProgress = 0;
      mockPaused = false;
      await wait(250, signal);
      return { analysisId: 'analysis-demo' };
    }

    const body = new FormData();
    if (input.file) body.append('file', input.file);
    if (input.text) body.append('text', input.text);
    body.append('documentType', input.documentType);
    const data = await request<unknown>('/analyses', { method: 'POST', body }, signal);
    return startAnalysisResponseSchema.parse(data);
  },

  async getProgress(id: string, signal?: AbortSignal): Promise<AnalysisProgress> {
    if (env.useMockApi) {
      await wait(180, signal);
      if (mockPaused) {
        const checks = createMockChecks(mockProgress);
        return {
          status: 'paused',
          progress: mockProgress,
          step: '분석 일시 정지',
          filename: '갯벌축제_계획_v3.hwpx',
          documentType: '계획 보고서',
          checks,
        };
      }
      mockProgress = Math.min(100, mockProgress + 12);
      const checks = createMockChecks(mockProgress);
      return {
        status: mockProgress >= 100 ? 'completed' : 'processing',
        progress: mockProgress,
        step: checks.find((check) => check.status === 'processing')?.label ?? '분석 완료',
        filename: '갯벌축제_계획_v3.hwpx',
        documentType: '계획 보고서',
        checks,
      };
    }
    const data = await request<unknown>(`/analyses/${id}`, {}, signal);
    return analysisProgressSchema.parse(data);
  },

  async getResult(id: string, signal?: AbortSignal): Promise<AnalysisResult> {
    if (env.useMockApi) {
      await wait(200, signal);
      return structuredClone(sampleResult);
    }
    const data = await request<unknown>(`/analyses/${id}/result`, {}, signal);
    return analysisResultSchema.parse(data);
  },

  async cancel(id: string, signal?: AbortSignal) {
    if (env.useMockApi) {
      await wait(180, signal);
      mockPaused = false;
      return;
    }
    await request<void>(`/analyses/${id}/cancel`, { method: 'POST' }, signal);
  },

  async pause(id: string, signal?: AbortSignal) {
    if (env.useMockApi) {
      mockPaused = true;
      await wait(120, signal);
      return;
    }
    await request<void>(`/analyses/${id}/pause`, { method: 'POST' }, signal);
  },

  async resume(id: string, signal?: AbortSignal) {
    if (env.useMockApi) {
      mockPaused = false;
      await wait(120, signal);
      return;
    }
    await request<void>(`/analyses/${id}/resume`, { method: 'POST' }, signal);
  },

  async retry(id: string, signal?: AbortSignal) {
    if (env.useMockApi) {
      mockProgress = 0;
      mockPaused = false;
      await wait(180, signal);
      return { analysisId: id };
    }
    const data = await request<unknown>(`/analyses/${id}/retry`, { method: 'POST' }, signal);
    return startAnalysisResponseSchema.parse(data);
  },

  async updateIssue(analysisId: string, issueId: string, status: IssueStatus) {
    if (env.useMockApi) return;
    await request(`/analyses/${analysisId}/issues/${issueId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};
