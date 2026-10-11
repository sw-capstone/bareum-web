import { beforeEach, describe, expect, it } from 'vitest';
import {
  completeAnalysis,
  getAnalysisRecords,
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
});
