import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { sampleResult } from '../../mocks/analysis';
import { ResultPage } from './ResultPage';

vi.mock('../../hooks/useAnalysis', () => ({
  useSaveIssueChanges: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
  useRegenerateSuggestion: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

function renderResult(analysisId = sampleResult.id) {
  return render(
    <ResultPage
      key={analysisId}
      result={{ ...sampleResult, id: analysisId }}
      analysisId={analysisId}
      onExport={vi.fn()}
      onFinish={vi.fn()}
    />,
  );
}

describe('ResultPage document view', () => {
  it('처음에는 결과 대시보드를 표시하고 전체보기는 열지 않는다', () => {
    renderResult();

    expect(screen.queryByText('종합 점수')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /수정 끝내기/ })).toBeVisible();
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
        onExport={vi.fn()}
        onFinish={vi.fn()}
      />,
    );

    expect(screen.queryByRole('dialog', { name: '문서 전체보기' })).not.toBeInTheDocument();
  });

  it('위치를 특정할 수 없는 판단보류 이슈는 최종 적용 문장을 수정할 수 없다', async () => {
    renderResult();

    await userEvent.click(
      screen.getByRole('button', {
        name: /일부 표를 읽지 못해 관련 검사 결과를 판단 보류했습니다/,
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
        name: /일부 표를 읽지 못해 관련 검사 결과를 판단 보류했습니다/,
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
        name: /판단보류 무시 일부 표를 읽지 못해 관련 검사 결과를 판단 보류했습니다/,
      }),
    ).toBeVisible();
  });

  it('수정안 적용을 선택해야 최종 적용 문장에 제안 내용을 복사한다', async () => {
    renderResult();

    await userEvent.click(
      screen.getByRole('button', {
        name: /사업 개요에 근거 법령이 명시되지 않았습니다/,
      }),
    );

    const finalSentence = screen.getByRole('textbox', { name: '최종 적용 문장' });
    expect(finalSentence).toHaveValue('');
    expect(document.querySelector('.comparison')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '수정안 적용' }));

    expect(finalSentence).toHaveValue(sampleResult.issues[0].suggestion);
  });

  it('적용 완료 문장은 잠그고 적용 취소 후 상세 화면에서 다시 편집할 수 있게 한다', async () => {
    renderResult();

    await userEvent.click(
      screen.getByRole('button', {
        name: /'별첨 3' 참조 표기를 문서 규칙에 맞게 통일했습니다/,
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
      name: /사업 개요에 근거 법령이 명시되지 않았습니다/,
    });
    await userEvent.click(issueCard);
    await userEvent.click(screen.getByRole('button', { name: '무시' }));

    await userEvent.click(
      screen.getByRole('button', {
        name: /높음 무시 사업 개요에 근거 법령이 명시되지 않았습니다/,
      }),
    );
    expect(screen.getByRole('textbox', { name: '최종 적용 문장' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '다른 수정안 받기' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '수정안 적용' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '적용' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: '무시 해제' }));
    await userEvent.click(
      screen.getByRole('button', {
        name: /높음 미해결 사업 개요에 근거 법령이 명시되지 않았습니다/,
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
