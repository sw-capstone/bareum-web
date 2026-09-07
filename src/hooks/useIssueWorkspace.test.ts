import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { sampleResult } from '../mocks/analysis';
import { useIssueWorkspace } from './useIssueWorkspace';
describe('useIssueWorkspace', () => {
  it('변경 사항을 계산하고 되돌린다', () => {
    const { result } = renderHook(() => useIssueWorkspace(sampleResult.issues));
    act(() => result.current.changeStatus('i1', 'resolved'));
    expect(result.current.isDirty).toBe(true);
    expect(result.current.changes).toEqual([{ issueId: 'i1', status: 'resolved' }]);
    act(() => result.current.revert());
    expect(result.current.isDirty).toBe(false);
  });
  it('저장한 변경을 새 기준 상태로 만든다', () => {
    const { result } = renderHook(() => useIssueWorkspace(sampleResult.issues));
    act(() => result.current.changeStatus('i1', 'resolved'));
    act(() => result.current.commit());
    expect(result.current.isDirty).toBe(false);
    expect(result.current.issues.find((issue) => issue.id === 'i1')?.status).toBe('resolved');
  });
});
