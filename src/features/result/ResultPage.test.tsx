import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sampleResult } from '../../mocks/analysis';
import { ResultPage } from './ResultPage';

const { exportMutateAsync } = vi.hoisted(() => ({ exportMutateAsync: vi.fn() }));

vi.mock('../../hooks/useAnalysis', () => ({
  useSaveIssueChanges: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
  useRegenerateSuggestion: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

vi.mock('../../hooks/useExport', () => ({
  useExport: () => ({ mutateAsync: exportMutateAsync }),
}));

function renderResult(analysisId = sampleResult.id) {
  return render(
    <ResultPage
      key={analysisId}
      result={{ ...sampleResult, id: analysisId }}
      analysisId={analysisId}
      onFinish={vi.fn()}
    />,
  );
}

describe('ResultPage document view', () => {
  beforeEach(() => {
    exportMutateAsync.mockReset();
    exportMutateAsync.mockResolvedValue(undefined);
  });

  it('처음에는 결과 대시보드를 표시하고 전체보기는 열지 않는다', () => {
    renderResult();

    expect(screen.queryByText('종합 점수')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /수정 끝내기/ })).toBeVisible();
    expect(screen.queryByRole('heading', { name: '문서 목차' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '문서 목차 열기' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(document.querySelector('.dashboard')).not.toHaveClass('dashboard--toc-open');
    expect(screen.getByRole('heading', { name: '이슈 목록' })).toBeVisible();
    expect(screen.queryByRole('dialog', { name: '문서 전체보기' })).not.toBeInTheDocument();
  });

  it('판단 보류와 일반 이슈를 별도 영역에 표시하고 카드 문구를 구분한다', () => {
    renderResult();

    const pending = screen.getByRole('region', { name: '판단 보류' });
    const regular = screen.getByRole('region', { name: '이슈 목록' });
    expect(within(pending).getByText('1건')).toBeVisible();
    expect(within(regular).getByText('6건')).toBeVisible();
    expect(
      within(pending).getByText(
        '원문 위치와 셀 구조를 특정할 수 없어 표 관련 검사를 수행하지 못했습니다.',
      ),
    ).toBeVisible();
    expect(
      within(regular).queryByText(/원문 위치와 셀 구조를 특정할 수 없어/),
    ).not.toBeInTheDocument();
    expect(within(regular).getByText(sampleResult.issues[0].suggestion)).toBeVisible();
    expect(screen.queryByRole('combobox', { name: '처리 상태' })).not.toBeInTheDocument();
  });

  it('심각도 필터는 일반 이슈에만 적용하고 빈 영역을 안내한다', async () => {
    const view = renderResult();

    await userEvent.selectOptions(screen.getByRole('combobox', { name: '심각도' }), 'high');
    expect(
      within(screen.getByRole('region', { name: '이슈 목록' })).getByText('2건'),
    ).toBeVisible();
    expect(
      within(screen.getByRole('region', { name: '판단 보류' })).getByText('1건'),
    ).toBeVisible();

    view.rerender(
      <ResultPage
        key="empty-analysis"
        result={{ ...sampleResult, issues: [] }}
        analysisId="empty-analysis"
        onFinish={vi.fn()}
      />,
    );
    expect(screen.getByText('판단 보류 이슈가 없습니다.')).toBeVisible();
    expect(screen.getByText('해당하는 이슈가 없습니다.')).toBeVisible();
  });

  it('수정안이 없는 일반 이슈는 기존 요약을 카드에 표시한다', () => {
    const issue = { ...sampleResult.issues[0], suggestionAvailable: false };
    render(
      <ResultPage
        result={{ ...sampleResult, issues: [issue] }}
        analysisId="no-suggestion"
        onFinish={vi.fn()}
      />,
    );

    expect(
      within(screen.getByRole('region', { name: '이슈 목록' })).getByText(issue.summary),
    ).toBeVisible();
  });

  it('문서 목차를 열고 닫으며 선택한 절로 문서 내부를 이동한다', async () => {
    renderResult();
    const scroller = document.querySelector<HTMLDivElement>('.paper-wrap');
    expect(scroller).not.toBeNull();
    const scrollTo = vi.fn();
    if (scroller) scroller.scrollTo = scrollTo;

    const openButton = screen.getByRole('button', { name: '문서 목차 열기' });
    expect(openButton).toHaveAttribute('aria-controls', 'result-toc');
    await userEvent.click(openButton);

    expect(screen.getByRole('heading', { name: '문서 목차' })).toBeVisible();
    expect(screen.getByRole('button', { name: '문서 목차 닫기' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(document.querySelector('.dashboard')).toHaveClass('dashboard--toc-open');

    await userEvent.click(
      within(screen.getByRole('complementary', { name: '문서 목차' })).getByRole('button', {
        name: /2\. 추진 배경 및 필요성/,
      }),
    );
    expect(scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'smooth', top: expect.any(Number) }),
    );

    await userEvent.click(screen.getByRole('button', { name: '문서 목차 닫기' }));
    expect(screen.queryByRole('heading', { name: '문서 목차' })).not.toBeInTheDocument();
    expect(document.querySelector('.dashboard')).not.toHaveClass('dashboard--toc-open');
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
        onFinish={vi.fn()}
      />,
    );

    expect(screen.queryByRole('dialog', { name: '문서 전체보기' })).not.toBeInTheDocument();
  });

  it('내보내기 버튼 아래에서 메뉴를 열고 배경을 가리지 않는다', async () => {
    renderResult();

    await userEvent.click(screen.getByRole('button', { name: '내보내기' }));

    expect(screen.getByRole('dialog', { name: '내보내기 메뉴' })).toBeVisible();
    expect(document.querySelector('.overlay')).not.toBeInTheDocument();
    expect(screen.getByLabelText('파일 형식')).toHaveValue('PDF');
  });

  it('다운로드 중에는 버튼을 비활성화하고 메뉴 하단에 진행 상태를 표시한다', async () => {
    exportMutateAsync.mockImplementation(() => new Promise(() => undefined));
    renderResult();

    await userEvent.click(screen.getByRole('button', { name: '내보내기' }));
    await userEvent.click(screen.getByRole('button', { name: '다운로드' }));

    expect(screen.getByRole('button', { name: '다운로드 중' })).toBeDisabled();
    expect(screen.getByText('파일을 준비하고 있습니다')).toBeVisible();
    expect(screen.getByRole('progressbar', { name: '다운로드 진행률' })).toBeVisible();
  });

  it('위치를 특정할 수 없는 판단보류 이슈는 최종 적용 문장을 수정할 수 없다', async () => {
    renderResult();

    await userEvent.click(
      screen.getByRole('button', {
        name: /원문 위치와 셀 구조를 특정할 수 없어 표 관련 검사를 수행하지 못했습니다/,
      }),
    );

    expect(screen.getByRole('textbox', { name: '최종 적용 문장' })).toBeDisabled();
    expect(
      screen.getByText(
        '문서 내 위치를 특정할 수 없는 판단 보류 이슈는 문장을 직접 수정할 수 없습니다.',
      ),
    ).toBeVisible();
  });

  it('이슈를 무시하면 상태를 갱신하고 상세 화면을 닫는다', async () => {
    renderResult();

    await userEvent.click(
      screen.getByRole('button', {
        name: /원문 위치와 셀 구조를 특정할 수 없어 표 관련 검사를 수행하지 못했습니다/,
      }),
    );
    await userEvent.click(screen.getByRole('button', { name: '무시' }));

    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: '표 검사 결과 확인 필요' }),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole('button', {
        name: /판단보류 무시 원문 위치와 셀 구조를 특정할 수 없어 표 관련 검사를 수행하지 못했습니다/,
      }),
    ).toBeVisible();
  });

  it('수정안 적용을 선택해야 최종 적용 문장에 제안 내용을 복사한다', async () => {
    renderResult();

    await userEvent.click(
      screen.getByRole('button', {
        name: /본 사업은.*지방재정법/,
      }),
    );

    const finalSentence = screen.getByRole('textbox', { name: '최종 적용 문장' });
    expect(finalSentence).toHaveValue('');
    expect(document.querySelector('.comparison')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '수정안 적용' }));

    expect(finalSentence).toHaveValue(sampleResult.issues[0].suggestion);
  });

  it('수정안 반영 안내를 제목 옆 정보 팁으로 제공한다', async () => {
    renderResult();

    await userEvent.click(
      screen.getByRole('button', {
        name: /본 사업은.*지방재정법/,
      }),
    );

    const helpButton = screen.getByRole('button', { name: '수정안 안내' });
    const tooltip = screen.getByRole('tooltip');
    expect(helpButton).toHaveAttribute('aria-describedby', tooltip.id);
    expect(tooltip).toHaveTextContent('새 수정안은 적용하기 전까지 본문에 반영되지 않습니다.');
  });

  it('적용 완료 문장은 잠그고 적용 취소 후 상세 화면에서 다시 편집할 수 있게 한다', async () => {
    renderResult();

    await userEvent.click(
      screen.getByRole('button', {
        name: /\(별첨 3\)에 정리한다/,
      }),
    );

    const finalSentence = screen.getByRole('textbox', { name: '최종 적용 문장' });
    expect(finalSentence).toBeDisabled();
    expect(screen.getByRole('button', { name: '다른 수정안 받기' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '수정안 적용' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: '적용 취소' }));

    await waitFor(() => expect(finalSentence).toBeEnabled());
    expect(screen.getByRole('dialog', { name: '표기 통일' })).toBeVisible();
    expect(screen.getByRole('button', { name: '다른 수정안 받기' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '수정안 적용' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '적용' })).toBeEnabled();
  });

  it('무시한 이슈는 수정 기능을 잠그고 무시 해제 후 다시 활성화한다', async () => {
    renderResult();

    const issueCard = screen.getByRole('button', {
      name: /본 사업은.*지방재정법/,
    });
    await userEvent.click(issueCard);
    await userEvent.click(screen.getByRole('button', { name: '무시' }));

    await userEvent.click(
      screen.getByRole('button', {
        name: /높음 무시 본 사업은.*지방재정법/,
      }),
    );
    expect(screen.getByRole('textbox', { name: '최종 적용 문장' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '다른 수정안 받기' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '수정안 적용' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '적용' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: '무시 해제' }));
    await userEvent.click(
      screen.getByRole('button', {
        name: /높음 미해결 본 사업은.*지방재정법/,
      }),
    );
    expect(screen.getByRole('textbox', { name: '최종 적용 문장' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '다른 수정안 받기' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '수정안 적용' })).toBeEnabled();
  });

  it('수정 끝내기를 누르면 최종 리포트 생성 진행 상태를 표시한다', async () => {
    renderResult();

    await userEvent.click(screen.getByRole('button', { name: /수정 끝내기/ }));

    expect(screen.getByRole('dialog', { name: '분석 완료' })).toBeVisible();
    expect(screen.getByText('최종 분석 리포트를 생성하고 있습니다')).toBeVisible();
    expect(screen.getByLabelText('리포트 생성 진행률')).toBeVisible();
  });
});
