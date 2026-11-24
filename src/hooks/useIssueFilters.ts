import { useMemo, useState } from 'react';
import type { Issue, Severity } from '../types';

type Filter<T> = T | 'all';
type FilterableSeverity = Exclude<Severity, 'pending'>;

export function useIssueFilters(issues: Issue[]) {
  const [severity, setSeverity] = useState<Filter<FilterableSeverity>>('all');
  const filteredIssues = useMemo(
    () =>
      issues.filter(
        (issue) => issue.level !== 'pending' && (severity === 'all' || issue.level === severity),
      ),
    [issues, severity],
  );
  return { severity, setSeverity, filteredIssues };
}
