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

export type AnalysisReportFolder = {
  id: string;
  title: string;
  filename: string;
  records: AnalysisRecord[];
  latestCompletedAt: string;
};

const STORAGE_KEY = 'bareum:recent-analysis';
const RECORDS_KEY = 'bareum:analysis-records';
const DEMO_RECORDS_KEY = 'bareum:analysis-records-demo-created';
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

export function ensureAnalysisHistoryDemo() {
  const existingRecords = getAnalysisRecords();
  if (existingRecords.some((record) => record.id.startsWith('saved-report-demo-'))) {
    saveAnalysisRecords(
      existingRecords.map((record) =>
        record.id.startsWith('saved-report-demo-')
          ? { ...record, title: '갯벌축제 계획 보고서', filename: '갯벌축제 계획 보고서.pdf' }
          : record,
      ),
    );
    return;
  }
  if (sessionStorage.getItem(DEMO_RECORDS_KEY)) return;
  sessionStorage.setItem(DEMO_RECORDS_KEY, 'true');
  if (existingRecords.length) return;
  const demoRecords: AnalysisRecord[] = [
    {
      id: 'saved-report-demo-3',
      title: '갯벌축제 계획 보고서',
      filename: '갯벌축제 계획 보고서.pdf',
      completedAt: '2026-09-24T06:20:00.000Z',
    },
    {
      id: 'saved-report-demo-2',
      title: '갯벌축제 계획 보고서',
      filename: '갯벌축제 계획 보고서.pdf',
      completedAt: '2026-09-23T02:40:00.000Z',
    },
    {
      id: 'saved-report-demo-1',
      title: '갯벌축제 계획 보고서',
      filename: '갯벌축제 계획 보고서.pdf',
      completedAt: '2026-09-21T01:10:00.000Z',
    },
  ];
  saveAnalysisRecords(demoRecords);
}

export function completeAnalysis(record: AnalysisRecord) {
  const records = getAnalysisRecords().filter((item) => item.id !== record.id);
  sessionStorage.setItem(RECORDS_KEY, JSON.stringify([record, ...records]));
  const recent = getRecentAnalysis();
  if (recent?.id === record.id) sessionStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(RECENT_ANALYSIS_EVENT));
}

function hashReport(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36);
}

export function getAnalysisReportId(record: Pick<AnalysisRecord, 'title' | 'filename'>) {
  return `report-${hashReport(`${record.title.trim()}::${record.filename.trim()}`)}`;
}

export function groupAnalysisRecords(records: AnalysisRecord[]): AnalysisReportFolder[] {
  const folders = new Map<string, AnalysisReportFolder>();
  [...records]
    .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt))
    .forEach((record) => {
      const id = getAnalysisReportId(record);
      const folder = folders.get(id);
      if (folder) {
        folder.records.push(record);
        return;
      }
      folders.set(id, {
        id,
        title: getReportDisplayName(record.filename),
        filename: record.filename,
        records: [record],
        latestCompletedAt: record.completedAt,
      });
    });
  return [...folders.values()];
}

export function getReportDisplayName(filename: string) {
  return filename.replace(/\.[^.]+$/, '');
}

function saveAnalysisRecords(records: AnalysisRecord[]) {
  sessionStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  window.dispatchEvent(new Event(RECENT_ANALYSIS_EVENT));
}

export function deleteAnalysisRecord(id: string) {
  saveAnalysisRecords(getAnalysisRecords().filter((record) => record.id !== id));
}

export function deleteAnalysisReport(reportId: string) {
  saveAnalysisRecords(
    getAnalysisRecords().filter((record) => getAnalysisReportId(record) !== reportId),
  );
}

export function isAnalysisCompleted(id: string) {
  return getAnalysisRecords().some((record) => record.id === id);
}
