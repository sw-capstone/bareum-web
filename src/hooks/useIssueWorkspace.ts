import { useMemo, useReducer } from 'react';
import type { Issue, IssueStatus } from '../types';

interface State {
  original: Issue[];
  current: Issue[];
}
type Action =
  | { type: 'replace'; issues: Issue[] }
  | { type: 'change'; issueId: string; status: IssueStatus }
  | { type: 'revert' }
  | { type: 'commit' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'replace':
      return { original: action.issues, current: action.issues };
    case 'change':
      return {
        ...state,
        current: state.current.map((issue) =>
          issue.id === action.issueId ? { ...issue, status: action.status } : issue,
        ),
      };
    case 'revert':
      return { ...state, current: state.original };
    case 'commit':
      return { original: state.current, current: state.current };
  }
}

export function useIssueWorkspace(initialIssues: Issue[]) {
  const [state, dispatch] = useReducer(reducer, {
    original: initialIssues,
    current: initialIssues,
  });
  const { current, original } = state;
  const changes = useMemo(
    () =>
      current.flatMap((issue) => {
        const savedIssue = original.find((item) => item.id === issue.id);
        return savedIssue?.status === issue.status
          ? []
          : [{ issueId: issue.id, status: issue.status }];
      }),
    [current, original],
  );
  return {
    issues: current,
    changes,
    isDirty: changes.length > 0,
    changeStatus: (issueId: string, status: IssueStatus) =>
      dispatch({ type: 'change', issueId, status }),
    revert: () => dispatch({ type: 'revert' }),
    commit: () => dispatch({ type: 'commit' }),
  };
}
