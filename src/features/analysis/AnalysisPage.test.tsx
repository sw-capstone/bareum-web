import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AnalysisPage, FailedPage } from './AnalysisPage';

const processingAnalysis = {
  status: 'processing' as const,
  progress: 50,
  step: '표현',
  title: '지역 축제 계획 보고서',
  filename: '계획서.pdf',
  documentType: '계획 보고서',
  checks: [
    { id: 'structure', label: '구조', status: 'completed' as const },
    { id: 'regulation', label: '규정', status: 'completed' as const },
    { id: 'expression', label: '표현', status: 'processing' as const },
    { id: 'consistency', label: '정합성', status: 'pending' as const },
  ],
};

describe('AnalysisPage', () => {
  it('API가 전달한 순서대로 검사 상태를 표시한다', () => {
    render(
      <AnalysisPage analysis={processingAnalysis} onCancel={vi.fn()} onViewResult={vi.fn()} />,
    );

    const labels = screen.getAllByRole('listitem').map((item) => item.textContent);
    expect(labels).toEqual([
      expect.stringContaining('구조'),
      expect.stringContaining('규정'),
      expect.stringContaining('표현'),
      expect.stringContaining('정합성'),
    ]);
    expect(screen.getByText('표현 검사를 수행하고 있습니다')).toBeInTheDocument();
    expect(screen.getByText('지역 축제 계획 보고서')).toBeInTheDocument();
  });

  it('분석 취소 전에 확인 안내를 표시한다', async () => {
    const onCancel = vi.fn();
    const onPause = vi.fn();
    const onResume = vi.fn();
    render(
      <AnalysisPage
        analysis={processingAnalysis}
        onCancel={onCancel}
        onPause={onPause}
        onResume={onResume}
        onViewResult={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: '분석 취소' }));

    expect(screen.getByRole('dialog', { name: '분석 취소 확인' })).toBeInTheDocument();
    expect(
      screen.getByText('취소하면 지금까지 생성된 검사 결과가 모두 폐기됩니다.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('결정하는 동안 분석은 일시 정지됩니다.')).not.toBeInTheDocument();
    expect(onPause).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: '닫기' }));
    expect(onResume).toHaveBeenCalledOnce();
  });

  it('검사가 끝난 뒤 결과 리포트 생성 단계를 별도로 표시한다', () => {
    render(
      <AnalysisPage
        analysis={{
          ...processingAnalysis,
          progress: 92,
          step: '결과 리포트 생성',
          checks: [
            ...processingAnalysis.checks.map((check) => ({
              ...check,
              status: 'completed' as const,
            })),
            { id: 'report-generation', label: '결과 리포트 생성', status: 'processing' },
          ],
        }}
        onCancel={vi.fn()}
        onViewResult={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('heading', { name: '결과 리포트를 생성하고 있습니다' }),
    ).toBeInTheDocument();
    expect(screen.getByText('결과 리포트 생성 중')).toBeInTheDocument();
    expect(screen.getByText('4 / 5개 단계 완료')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '92');
  });

  it('리포트 생성까지 끝나면 전체 완료를 표시한다', () => {
    render(
      <AnalysisPage
        analysis={{
          ...processingAnalysis,
          status: 'completed',
          progress: 100,
          step: '분석 완료',
          checks: [
            ...processingAnalysis.checks.map((check) => ({
              ...check,
              status: 'completed' as const,
            })),
            { id: 'report-generation', label: '결과 리포트 생성', status: 'completed' },
          ],
        }}
        onCancel={vi.fn()}
        onViewResult={vi.fn()}
      />,
    );

    expect(screen.getByText('분석과 결과 리포트 생성이 완료되었습니다')).toBeInTheDocument();
    expect(screen.getByText('5 / 5개 단계 완료')).toBeInTheDocument();
  });
});

describe('FailedPage', () => {
  it('리포트 생성 실패 시 완료된 검사 결과를 최종 결과로 열지 않는다', () => {
    render(
      <FailedPage
        analysis={{
          ...processingAnalysis,
          status: 'partial_failed',
          progress: 96,
          step: '결과 리포트 생성 실패',
          checks: [
            { id: 'structure', label: '구조', status: 'completed' },
            {
              id: 'report-generation',
              label: '결과 리포트 생성',
              status: 'failed',
              errorCode: 'REPORT_FAILED',
            },
          ],
        }}
        onRetry={vi.fn()}
        onPartialResult={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('heading', { name: '결과 리포트를 생성하지 못했습니다' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '부분 결과 보기' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다시 분석' })).toBeInTheDocument();
  });

  it('부분 실패 항목과 부분 결과 버튼을 표시한다', () => {
    render(
      <FailedPage
        analysis={{
          ...processingAnalysis,
          status: 'partial_failed',
          progress: 100,
          checks: [
            { id: 'structure', label: '구조', status: 'completed' },
            {
              id: 'expression',
              label: '표현',
              status: 'failed',
              errorCode: 'EXPRESSION_TIMEOUT',
              errorMessage: '표현 검사 시간이 초과되었습니다.',
            },
          ],
        }}
        onRetry={vi.fn()}
        onPartialResult={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('heading', { name: '일부 검사를 완료하지 못했습니다' }),
    ).toBeInTheDocument();
    expect(screen.getByText('표현 검사 시간이 초과되었습니다.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '부분 결과 보기' })).toBeInTheDocument();
  });

  it('전체 실패 시 결과 버튼 대신 분석 취소 버튼을 표시한다', () => {
    render(
      <FailedPage
        analysis={{
          status: 'failed',
          progress: 42,
          step: '규정',
          errorCode: 'ANALYSIS_TIMEOUT',
          errorMessage: '최대 분석 시간을 초과했습니다.',
        }}
        onRetry={vi.fn()}
        onPartialResult={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: '분석에 실패했습니다' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '부분 결과 보기' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '분석 취소' })).toBeInTheDocument();
  });
});
