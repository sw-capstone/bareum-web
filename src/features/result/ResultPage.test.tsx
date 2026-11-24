import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sampleResult } from '../../mocks/analysis';
import { ResultPage } from './ResultPage';

const { exportMutateAsync } = vi.hoisted(() => ({ exportMutateAsync: vi.fn() }));

vi.mock('../../hooks/useExport', () => ({
  useExport: () => ({ mutateAsync: exportMutateAsync }),
}));

function renderResult(analysisId = sampleResult.id) {
  return render(
    <ResultPage key={analysisId} result={{ ...sampleResult, id: analysisId }} onFinish={vi.fn()} />,
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
        onFinish={vi.fn()}
      />,
    );
    expect(screen.getByText('판단 보류 이슈가 없습니다.')).toBeVisible();
    expect(screen.getByText('해당하는 이슈가 없습니다.')).toBeVisible();
  });

  it('수정안이 없는 일반 이슈는 기존 요약을 카드에 표시한다', () => {
    const issue = { ...sampleResult.issues[0], suggestionAvailable: false };
    render(<ResultPage result={{ ...sampleResult, issues: [issue] }} onFinish={vi.fn()} />);

    expect(
      within(screen.getByRole('region', { name: '이슈 목록' })).getByText(issue.summary),
    ).toBeVisible();
  });

  it('확인 토글을 켜고 끄면 카드 순서와 확인 진행률이 바뀌고 문서 원문은 유지된다', async () => {
    renderResult();
    const regular = screen.getByRole('region', { name: '이슈 목록' });
    const progress = document.querySelector('.resolution');
    const first = within(regular).getByRole('switch', { name: '근거 법령 미기재 확인' });
    const second = within(regular).getByRole('switch', { name: '숫자 표기 상이 확인' });
    const cardOrder = () =>
      Array.from(regular.querySelectorAll('.issue-card')).map((card) =>
        card.querySelector('[role="switch"]')?.getAttribute('aria-label'),
      );

    expect(first).toHaveAttribute('aria-checked', 'false');
    expect(progress).toHaveTextContent('7건 중 0건 확인');
    await userEvent.click(first);
    expect(first).toHaveAttribute('aria-checked', 'true');
    expect(first.closest('.issue-card')).toHaveClass('is-confirmed');
    expect(cardOrder().at(-1)).toBe('근거 법령 미기재 확인');
    expect(progress).toHaveTextContent('7건 중 1건 확인');
    expect(progress).toHaveTextContent('14%');
    expect(document.querySelector('.paper')).toHaveTextContent(
      '근거 법령은 별도로 명시하지 않았다.',
    );

    await userEvent.click(second);
    expect(cardOrder().slice(-2)).toEqual(['근거 법령 미기재 확인', '숫자 표기 상이 확인']);
    await userEvent.click(first);
    expect(first).toHaveAttribute('aria-checked', 'false');
    expect(first.closest('.issue-card')).not.toHaveClass('is-confirmed');
    expect(cardOrder().slice(-2)).toEqual(['근거 법령 미기재 확인', '숫자 표기 상이 확인']);
    expect(progress).toHaveTextContent('7건 중 1건 확인');
    await userEvent.click(second);
    expect(progress).toHaveTextContent('7건 중 0건 확인');
  });

  it('판단 보류 토글도 키보드로 조작하고 확인 상태에 따라 순서를 바꾼다', async () => {
    const additionalPending = {
      ...sampleResult.issues[6],
      id: 'i8',
      title: '추가 표 확인 필요',
      pendingReason: '추가 표 확인이 필요합니다.',
    };
    render(
      <ResultPage
        result={{ ...sampleResult, issues: [...sampleResult.issues, additionalPending] }}
        onFinish={vi.fn()}
      />,
    );
    const pending = screen.getByRole('region', { name: '판단 보류' });
    const first = within(pending).getByRole('switch', { name: '표 검사 결과 확인 필요 확인' });
    const second = within(pending).getByRole('switch', { name: '추가 표 확인 필요 확인' });
    const cardOrder = () =>
      Array.from(pending.querySelectorAll('.issue-card')).map((card) =>
        card.querySelector('[role="switch"]')?.getAttribute('aria-label'),
      );

    first.focus();
    await userEvent.keyboard(' ');
    expect(first).toHaveAttribute('aria-checked', 'true');
    expect(cardOrder()).toEqual(['추가 표 확인 필요 확인', '표 검사 결과 확인 필요 확인']);
    await userEvent.click(second);
    await userEvent.click(first);
    expect(cardOrder()).toEqual(['표 검사 결과 확인 필요 확인', '추가 표 확인 필요 확인']);
    expect(screen.getByText('8건 중 1건 확인')).toBeVisible();
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

  it('일반 이슈 상세는 원문과 수정안 하나만 읽고 확인할 수 있다', async () => {
    renderResult();
    const issue = sampleResult.issues[0];
    const cardSwitch = screen.getByRole('switch', { name: `${issue.title} 확인` });

    await userEvent.click(screen.getByRole('button', { name: /본 사업은.*지방재정법/ }));
    const detail = screen.getByRole('dialog', { name: issue.title });
    expect(within(detail).getByText(issue.original)).toBeVisible();
    expect(within(detail).getByText(issue.explanation)).toBeVisible();
    expect(within(detail).getByText(issue.suggestion)).toBeVisible();
    expect(within(detail).queryByRole('textbox')).not.toBeInTheDocument();
    expect(
      within(detail).queryByRole('button', { name: /무시|수정안 적용|다른 수정안 받기/ }),
    ).not.toBeInTheDocument();

    await userEvent.click(within(detail).getByRole('button', { name: '확인' }));
    expect(screen.queryByRole('dialog', { name: issue.title })).not.toBeInTheDocument();
    expect(cardSwitch).toHaveAttribute('aria-checked', 'true');
    expect(cardSwitch.closest('.issue-card')).toHaveClass('is-confirmed');
    expect(screen.getByText('7건 중 1건 확인')).toBeVisible();
    expect(document.querySelector('.paper')).toHaveTextContent(issue.original);
  });

  it('판단 보류 상세도 확인 버튼으로 해당 카드 토글을 켠다', async () => {
    renderResult();
    const issue = sampleResult.issues[6];

    await userEvent.click(
      screen.getByRole('button', { name: /원문 위치와 셀 구조를 특정할 수 없어/ }),
    );
    const detail = screen.getByRole('dialog', { name: issue.title });
    expect(within(detail).getByText(issue.pendingReason!)).toBeVisible();
    expect(within(detail).getByText(issue.userChecks![0])).toBeVisible();
    expect(
      within(detail).queryByRole('heading', { name: '최종 적용 문장' }),
    ).not.toBeInTheDocument();
    expect(within(detail).getByRole('button', { name: '확인' })).toBeEnabled();

    await userEvent.click(within(detail).getByRole('button', { name: '확인' }));
    expect(screen.getByRole('switch', { name: `${issue.title} 확인` })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('X로 닫으면 확인 상태가 유지되고 이미 확인한 카드의 확인 버튼은 해제하지 않는다', async () => {
    renderResult();
    const issue = sampleResult.issues[0];
    const card = screen.getByRole('button', { name: /본 사업은.*지방재정법/ });
    const cardSwitch = screen.getByRole('switch', { name: `${issue.title} 확인` });

    await userEvent.click(card);
    await userEvent.click(
      within(screen.getByRole('dialog', { name: issue.title })).getByRole('button', {
        name: '닫기',
      }),
    );
    expect(cardSwitch).toHaveAttribute('aria-checked', 'false');

    await userEvent.click(cardSwitch);
    await userEvent.click(card);
    await userEvent.click(
      within(screen.getByRole('dialog', { name: issue.title })).getByRole('button', {
        name: '닫기',
      }),
    );
    expect(cardSwitch).toHaveAttribute('aria-checked', 'true');

    await userEvent.click(card);
    await userEvent.click(
      within(screen.getByRole('dialog', { name: issue.title })).getByRole('button', {
        name: '확인',
      }),
    );
    expect(cardSwitch).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('7건 중 1건 확인')).toBeVisible();
  });

  it('기존 결과에 적용 문장이 있어도 문서에는 업로드한 원문을 표시한다', () => {
    renderResult();
    const original = sampleResult.sections[3].paragraphs[0][1].text;

    expect(document.querySelector('.paper')).toHaveTextContent(original);
    expect(document.querySelector('.paper')).not.toHaveTextContent('(별첨 3)에 정리한다.');
  });

  it('수정 끝내기를 누르면 최종 리포트 생성 진행 상태를 표시한다', async () => {
    renderResult();

    await userEvent.click(screen.getByRole('button', { name: /수정 끝내기/ }));

    expect(screen.getByRole('dialog', { name: '분석 완료' })).toBeVisible();
    expect(screen.getByText('최종 분석 리포트를 생성하고 있습니다')).toBeVisible();
    expect(screen.getByLabelText('리포트 생성 진행률')).toBeVisible();
  });
});
