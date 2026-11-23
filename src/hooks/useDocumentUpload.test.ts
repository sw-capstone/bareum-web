import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MAX_FILE_SIZE, useDocumentUpload, validateFile } from './useDocumentUpload';
describe('useDocumentUpload', () => {
  it('업로드한 파일과 문서 유형만 분석 요청에 포함한다', () => {
    const { result } = renderHook(() => useDocumentUpload());
    const file = new File(['report'], 'report.pdf', { type: 'application/pdf' });
    act(() => result.current.dispatch({ type: 'file', value: file }));
    act(() => result.current.dispatch({ type: 'documentType', value: '결과 보고서' }));
    expect(result.current.createRequest()).toEqual({ file, documentType: '결과 보고서' });
  });
  it('파일 처리가 완료되기 전에는 분석을 시작할 수 없다', () => {
    const { result } = renderHook(() => useDocumentUpload());
    const file = new File(['report'], 'report.pdf', { type: 'application/pdf' });
    act(() => result.current.dispatch({ type: 'file', value: file }));

    expect(result.current.state.fileStatus).toBe('processing');
    expect(result.current.isValid).toBe(false);

    act(() => result.current.dispatch({ type: 'fileStatus', value: 'completed' }));
    expect(result.current.isValid).toBe(true);
  });
  it('지원 형식과 20MB 용량 제한을 검증한다', () => {
    expect(validateFile(new File(['x'], 'report.txt'))).toContain('지원하지 않는');
    expect(validateFile(new File([new Uint8Array(MAX_FILE_SIZE + 1)], 'report.pdf'))).toContain(
      '20MB',
    );
  });
});
