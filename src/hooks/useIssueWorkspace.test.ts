import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { sampleResult } from '../mocks/analysis';
import { useIssueWorkspace } from './useIssueWorkspace';
describe('useIssueWorkspace', () => {
  it('이슈의 처리 상태와 적용 문장을 갱신한다', () => {
    const { result } = renderHook(() => useIssueWorkspace(sampleResult.issues));
    act(() => result.current.updateIssue('i1', { status: 'resolved', appliedText: '수정 문장' }));
    expect(result.current.issues.find((issue) => issue.id === 'i1')).toMatchObject({
      status: 'resolved',
      appliedText: '수정 문장',
    });
  });
  it('서버에서 다시 받은 이슈 목록으로 교체한다', () => {
    const { result } = renderHook(() => useIssueWorkspace(sampleResult.issues));
    const next = sampleResult.issues.map((issue) => ({ ...issue, status: 'ignored' as const }));
    act(() => result.current.replace(next));
    expect(result.current.issues.every((issue) => issue.status === 'ignored')).toBe(true);
  });
});
