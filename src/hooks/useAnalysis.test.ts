import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { analysisApi } from '../services/analysisApi';
import { analysisKeys, removeAnalysisCache, useStartAnalysis } from './useAnalysis';

describe('removeAnalysisCache', () => {
  it('새 분석 ID와 같은 이전 진행 상태 및 결과 캐시를 제거한다', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(analysisKeys.progress('analysis-demo'), {
      status: 'completed',
      progress: 100,
    });
    queryClient.setQueryData(analysisKeys.result('analysis-demo'), { id: 'analysis-demo' });
    queryClient.setQueryData(analysisKeys.progress('another-analysis'), {
      status: 'processing',
      progress: 24,
    });

    removeAnalysisCache(queryClient, 'analysis-demo');

    expect(queryClient.getQueryData(analysisKeys.progress('analysis-demo'))).toBeUndefined();
    expect(queryClient.getQueryData(analysisKeys.result('analysis-demo'))).toBeUndefined();
    expect(queryClient.getQueryData(analysisKeys.progress('another-analysis'))).toEqual({
      status: 'processing',
      progress: 24,
    });
  });
});

describe('useStartAnalysis', () => {
  it('새 분석 시작이 성공하면 화면 이동 전에 동일 ID의 완료 캐시를 제거한다', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(analysisKeys.progress('analysis-demo'), {
      status: 'completed',
      progress: 100,
    });
    queryClient.setQueryData(analysisKeys.result('analysis-demo'), { id: 'analysis-demo' });
    vi.spyOn(analysisApi, 'start').mockResolvedValueOnce({ analysisId: 'analysis-demo' });
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);
    const { result } = renderHook(() => useStartAnalysis(), { wrapper });

    await act(() =>
      result.current.mutateAsync({ text: '새로운 보고서', documentType: '계획 보고서' }),
    );

    expect(queryClient.getQueryData(analysisKeys.progress('analysis-demo'))).toBeUndefined();
    expect(queryClient.getQueryData(analysisKeys.result('analysis-demo'))).toBeUndefined();
  });
});
