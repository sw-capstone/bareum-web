import { beforeEach, describe, expect, it } from 'vitest';
import {
  completeAnalysis,
  deleteAnalysisRecord,
  deleteAnalysisReport,
  getAnalysisRecords,
  groupAnalysisRecords,
  getRecentAnalysis,
  setRecentAnalysis,
} from './recentAnalysis';

describe('analysis completion state', () => {
  beforeEach(() => sessionStorage.clear());

  it('미완료 결과는 최근 결과로만 유지하고 기록에는 표시하지 않는다', () => {
    setRecentAnalysis({ id: 'analysis-1', status: 'result' });

    expect(getRecentAnalysis()).toEqual({ id: 'analysis-1', status: 'result' });
    expect(getAnalysisRecords()).toEqual([]);
  });

  it('수정 끝내기 완료 후 최근 결과를 기록으로 확정한다', () => {
    setRecentAnalysis({ id: 'analysis-1', status: 'result' });
    completeAnalysis({
      id: 'analysis-1',
      title: '테스트 보고서',
      filename: 'test.pdf',
      completedAt: '2026-10-11T12:00:00.000Z',
    });

    expect(getRecentAnalysis()).toBeNull();
    expect(getAnalysisRecords()).toHaveLength(1);
    expect(getAnalysisRecords()[0].title).toBe('테스트 보고서');
  });

  it('같은 보고서의 여러 분석 결과를 하나의 보고서 폴더로 묶는다', () => {
    completeAnalysis({
      id: 'analysis-1',
      title: '테스트 보고서',
      filename: 'test.pdf',
      completedAt: '2026-10-11T12:00:00.000Z',
    });
    completeAnalysis({
      id: 'analysis-2',
      title: '테스트 보고서',
      filename: 'test.pdf',
      completedAt: '2026-10-12T12:00:00.000Z',
    });

    const folders = groupAnalysisRecords(getAnalysisRecords());
    expect(folders).toHaveLength(1);
    expect(folders[0].records.map((record) => record.id)).toEqual(['analysis-2', 'analysis-1']);
  });

  it('개별 기록과 보고서 폴더를 사용자의 선택으로 삭제한다', () => {
    completeAnalysis({
      id: 'analysis-1',
      title: '첫 보고서',
      filename: 'first.pdf',
      completedAt: '2026-10-11T12:00:00.000Z',
    });
    completeAnalysis({
      id: 'analysis-2',
      title: '둘째 보고서',
      filename: 'second.pdf',
      completedAt: '2026-10-12T12:00:00.000Z',
    });

    deleteAnalysisRecord('analysis-1');
    expect(getAnalysisRecords().map((record) => record.id)).toEqual(['analysis-2']);

    const [folder] = groupAnalysisRecords(getAnalysisRecords());
    deleteAnalysisReport(folder.id);
    expect(getAnalysisRecords()).toEqual([]);
  });
});
