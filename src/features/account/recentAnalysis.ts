export type RecentAnalysis = {
  id: string;
  status: 'analyzing' | 'result';
};

const STORAGE_KEY = 'bareum:recent-analysis';
export const RECENT_ANALYSIS_EVENT = 'bareum:recent-analysis-changed';

export function getRecentAnalysis(): RecentAnalysis | null {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as Partial<RecentAnalysis>;
    if (
      typeof parsed.id !== 'string' ||
      (parsed.status !== 'analyzing' && parsed.status !== 'result')
    )
      return null;
    return parsed as RecentAnalysis;
  } catch {
    return null;
  }
}

export function setRecentAnalysis(value: RecentAnalysis) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  window.dispatchEvent(new Event(RECENT_ANALYSIS_EVENT));
}
