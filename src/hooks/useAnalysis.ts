import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { analysisApi, type AnalysisRequest } from '../services/analysisApi';
import type { IssueStatus } from '../types';

export const analysisKeys = {
  all: ['analyses'] as const,
  progress: (id: string) => [...analysisKeys.all, id, 'progress'] as const,
  result: (id: string) => [...analysisKeys.all, id, 'result'] as const,
};

export function removeAnalysisCache(queryClient: QueryClient, analysisId: string) {
  queryClient.removeQueries({ queryKey: analysisKeys.progress(analysisId), exact: true });
  queryClient.removeQueries({ queryKey: analysisKeys.result(analysisId), exact: true });
}

export function useStartAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AnalysisRequest) => analysisApi.start(input),
    onSuccess: ({ analysisId }) => removeAnalysisCache(queryClient, analysisId),
  });
}

export function useAnalysisProgress(id: string) {
  return useQuery({
    queryKey: analysisKeys.progress(id),
    queryFn: ({ signal }) => analysisApi.getProgress(id, signal),
    enabled: Boolean(id),
    refetchInterval: (query) =>
      ['completed', 'partial_failed', 'failed', 'canceled'].includes(query.state.data?.status ?? '')
        ? false
        : 500,
    retry: 2,
  });
}

export function useCancelAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => analysisApi.cancel(id),
    onSuccess: (_, id) => queryClient.invalidateQueries({ queryKey: analysisKeys.progress(id) }),
  });
}

export function usePauseAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => analysisApi.pause(id),
    onSuccess: (_, id) => queryClient.invalidateQueries({ queryKey: analysisKeys.progress(id) }),
  });
}

export function useResumeAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => analysisApi.resume(id),
    onSuccess: (_, id) => queryClient.invalidateQueries({ queryKey: analysisKeys.progress(id) }),
  });
}

export function useRetryAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => analysisApi.retry(id),
    onSuccess: ({ analysisId }) => removeAnalysisCache(queryClient, analysisId),
  });
}

export function useAnalysisResult(id: string) {
  return useQuery({
    queryKey: analysisKeys.result(id),
    queryFn: ({ signal }) => analysisApi.getResult(id, signal),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveIssueChanges(analysisId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (changes: Array<{ issueId: string; status: IssueStatus }>) =>
      Promise.all(
        changes.map((change) => analysisApi.updateIssue(analysisId, change.issueId, change.status)),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: analysisKeys.result(analysisId) }),
  });
}
