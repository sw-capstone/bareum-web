import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { analysisApi, type AnalysisRequest } from '../services/analysisApi';
import type { IssueStatus } from '../types';

export const analysisKeys = {
  all: ['analyses'] as const,
  progress: (id: string) => [...analysisKeys.all, id, 'progress'] as const,
  result: (id: string) => [...analysisKeys.all, id, 'result'] as const,
};

export function useStartAnalysis() {
  return useMutation({ mutationFn: (input: AnalysisRequest) => analysisApi.start(input) });
}

export function useAnalysisProgress(id: string) {
  return useQuery({
    queryKey: analysisKeys.progress(id),
    queryFn: ({ signal }) => analysisApi.getProgress(id, signal),
    enabled: Boolean(id),
    refetchInterval: (query) =>
      query.state.data?.status === 'completed' || query.state.data?.status === 'failed'
        ? false
        : 500,
    retry: 2,
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
