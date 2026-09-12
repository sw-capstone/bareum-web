import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { sampleResult } from '../../mocks/analysis';
import { ResultPage } from './ResultPage';

vi.mock('../../hooks/useAnalysis', () => ({
  useSaveIssueChanges: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
}));

function renderResult(analysisId = sampleResult.id) {
  return render(
    <ResultPage
      key={analysisId}
      result={{ ...sampleResult, id: analysisId }}
      analysisId={analysisId}
      onReport={vi.fn()}
      onExport={vi.fn()}
    />,
  );
}

describe('ResultPage document view', () => {
  it('처음에는 결과 대시보드를 표시하고 전체보기는 열지 않는다', () => {
    renderResult();

    expect(screen.getByText('종합 점수')).toBeVisible();
    expect(screen.getByRole('heading', { name: '문서 목차' })).toBeVisible();
    expect(screen.getByRole('heading', { name: '이슈 목록' })).toBeVisible();
    expect(screen.queryByRole('dialog', { name: '문서 전체보기' })).not.toBeInTheDocument();
  });

  it('문서 전체보기 버튼을 누른 뒤에만 전체 문서를 연다', async () => {
    renderResult();

    await userEvent.click(screen.getByRole('button', { name: '문서 전체보기' }));

    expect(screen.getByRole('dialog', { name: '문서 전체보기' })).toBeVisible();
  });

  it('새 분석 결과로 이동하면 열려 있던 전체보기를 닫는다', async () => {
    const view = renderResult('analysis-1');
    await userEvent.click(screen.getByRole('button', { name: '문서 전체보기' }));
    expect(screen.getByRole('dialog', { name: '문서 전체보기' })).toBeVisible();

    view.rerender(
      <ResultPage
        key="analysis-2"
        result={{ ...sampleResult, id: 'analysis-2' }}
        analysisId="analysis-2"
        onReport={vi.fn()}
        onExport={vi.fn()}
      />,
    );

    expect(screen.queryByRole('dialog', { name: '문서 전체보기' })).not.toBeInTheDocument();
  });
});
