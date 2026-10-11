import { useMemo, useState } from 'react';
import type { Issue, IssueStatus, Severity } from '../types';

type Filter<T> = T | 'all';

export function useIssueFilters(issues: Issue[]) {
  const [severity, setSeverity] = useState<Filter<Severity>>('all');
  const [status, setStatus] = useState<Filter<IssueStatus>>('all');
  const filteredIssues = useMemo(
    () =>
      issues
        .filter(
          (issue) =>
            (severity === 'all' || issue.level === severity) &&
            (status === 'all' || issue.status === status),
        )
        .sort((a, b) => {
          if (!a.location && b.location) return -1;
          if (a.location && !b.location) return 1;
          return (
            (a.locationOrder ?? Number.MAX_SAFE_INTEGER) -
            (b.locationOrder ?? Number.MAX_SAFE_INTEGER)
          );
        }),
    [issues, severity, status],
  );
  return { severity, setSeverity, status, setStatus, filteredIssues };
}
