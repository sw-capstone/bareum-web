export type RecentAnalysis = {
  id: string;
  status: 'analyzing' | 'result';
};

export type AnalysisRecord = {
  id: string;
  title: string;
  filename: string;
  completedAt: string;
};

const STORAGE_KEY = 'bareum:recent-analysis';
const RECORDS_KEY = 'bareum:analysis-records';
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
  if (getAnalysisRecords().some((record) => record.id === value.id)) return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  window.dispatchEvent(new Event(RECENT_ANALYSIS_EVENT));
}

export function getAnalysisRecords(): AnalysisRecord[] {
  try {
    const value = sessionStorage.getItem(RECORDS_KEY);
    const parsed: unknown = value ? JSON.parse(value) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (record): record is AnalysisRecord =>
        typeof record === 'object' &&
        record !== null &&
        typeof record.id === 'string' &&
        typeof record.title === 'string' &&
        typeof record.filename === 'string' &&
        typeof record.completedAt === 'string',
    );
  } catch {
    return [];
  }
}

export function completeAnalysis(record: AnalysisRecord) {
  const records = getAnalysisRecords().filter((item) => item.id !== record.id);
  sessionStorage.setItem(RECORDS_KEY, JSON.stringify([record, ...records]));
  const recent = getRecentAnalysis();
  if (recent?.id === record.id) sessionStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(RECENT_ANALYSIS_EVENT));
}

export function isAnalysisCompleted(id: string) {
  return getAnalysisRecords().some((record) => record.id === id);
}
