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
  scopes: string[];
  maskingFields: string[];
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

export const analysisApi = {
  async start(input: AnalysisRequest, signal?: AbortSignal) {
    if (env.useMockApi) {
      mockProgress = 0;
      await wait(250, signal);
      return { analysisId: 'analysis-demo' };
    }

    const body = new FormData();
    if (input.file) body.append('file', input.file);
    if (input.text) body.append('text', input.text);
    body.append('documentType', input.documentType);
    body.append('scopes', JSON.stringify(input.scopes));
    body.append('maskingFields', JSON.stringify(input.maskingFields));
    const data = await request<unknown>('/analyses', { method: 'POST', body }, signal);
    return startAnalysisResponseSchema.parse(data);
  },

  async getProgress(id: string, signal?: AbortSignal): Promise<AnalysisProgress> {
    if (env.useMockApi) {
      await wait(180, signal);
      mockProgress = Math.min(100, mockProgress + 12);
      return {
        status: mockProgress >= 100 ? 'completed' : 'processing',
        progress: mockProgress,
        step: ['문서 파싱', '구조 분석', '규정 매칭', '표현 검토', '점수 산출'][
          Math.min(4, Math.floor(mockProgress / 21))
        ],
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

  async updateIssue(analysisId: string, issueId: string, status: IssueStatus) {
    if (env.useMockApi) return;
    await request(`/analyses/${analysisId}/issues/${issueId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};
