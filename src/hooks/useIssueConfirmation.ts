import { useMemo, useState } from 'react';
import type { Issue } from '../types';

type ConfirmationState = { confirmed: Set<string>; order: string[] };

function initialOrder(issues: Issue[]) {
  return [...issues]
    .sort((a, b) => {
      if (!a.location && b.location) return -1;
      if (a.location && !b.location) return 1;
      return (
        (a.locationOrder ?? Number.MAX_SAFE_INTEGER) - (b.locationOrder ?? Number.MAX_SAFE_INTEGER)
      );
    })
    .map((issue) => issue.id);
}

export function useIssueConfirmation(issues: Issue[]) {
  const [state, setState] = useState<ConfirmationState>(() => ({
    confirmed: new Set(),
    order: initialOrder(issues),
  }));

  const orderedIssues = useMemo(() => {
    const positions = new Map(state.order.map((id, index) => [id, index]));
    return [...issues].sort((a, b) => {
      const confirmationOrder =
        Number(state.confirmed.has(a.id)) - Number(state.confirmed.has(b.id));
      return (
        confirmationOrder || (positions.get(a.id) ?? Infinity) - (positions.get(b.id) ?? Infinity)
      );
    });
  }, [issues, state]);

  function setConfirmation(issueId: string, next: (confirmed: boolean) => boolean) {
    setState((current) => {
      const wasConfirmed = current.confirmed.has(issueId);
      const nowConfirmed = next(wasConfirmed);
      if (wasConfirmed === nowConfirmed) return current;
      const confirmed = new Set(current.confirmed);
      if (nowConfirmed) confirmed.add(issueId);
      else confirmed.delete(issueId);

      const remaining = current.order.filter((id) => id !== issueId);
      const firstConfirmed = remaining.findIndex((id) => confirmed.has(id));
      const insertionIndex = nowConfirmed || firstConfirmed < 0 ? remaining.length : firstConfirmed;
      remaining.splice(insertionIndex, 0, issueId);
      return { confirmed, order: remaining };
    });
  }

  return {
    confirmed: state.confirmed,
    orderedIssues,
    toggle: (issueId: string) => setConfirmation(issueId, (current) => !current),
    confirm: (issueId: string) => setConfirmation(issueId, () => true),
  };
}
