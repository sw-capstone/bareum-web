import { useReducer } from 'react';
import type { Issue } from '../types';

type Action =
  { type: 'update'; issueId: string; patch: Partial<Issue> } | { type: 'replace'; issues: Issue[] };

function reducer(issues: Issue[], action: Action): Issue[] {
  if (action.type === 'replace') return action.issues;
  return issues.map((issue) =>
    issue.id === action.issueId ? { ...issue, ...action.patch } : issue,
  );
}

export function useIssueWorkspace(initialIssues: Issue[]) {
  const [issues, dispatch] = useReducer(reducer, initialIssues);
  return {
    issues,
    updateIssue: (issueId: string, patch: Partial<Issue>) =>
      dispatch({ type: 'update', issueId, patch }),
    replace: (nextIssues: Issue[]) => dispatch({ type: 'replace', issues: nextIssues }),
  };
}
