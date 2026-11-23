import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UploadPage } from './UploadPage';

describe('UploadPage file-only flow', () => {
  afterEach(() => vi.useRealTimers());

  it('파일만 선택해 분석 요청을 만들고 직접 입력 화면을 표시하지 않는다', () => {
    vi.useFakeTimers();
    const onAnalyze = vi.fn();
    const { container } = render(<UploadPage onAnalyze={onAnalyze} />);
    const startButton = screen.getByRole('button', { name: '분석 시작' });

    expect(screen.queryByRole('tab', { name: '직접 입력' })).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: '보고서 이름' })).not.toBeInTheDocument();
    expect(startButton).toBeDisabled();

    const file = new File(['보고서'], '계획서.pdf', { type: 'application/pdf' });
    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).not.toBeNull();
    fireEvent.change(fileInput!, { target: { files: [file] } });
    expect(startButton).toBeDisabled();

    act(() => vi.advanceTimersByTime(900));
    expect(startButton).toBeEnabled();
    fireEvent.click(startButton);
    expect(onAnalyze).toHaveBeenCalledWith({ file, documentType: '계획 보고서' });
  });
});
