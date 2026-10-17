import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  MAX_FILE_SIZE,
  MAX_TEXT_LENGTH,
  useDocumentUpload,
  validateFile,
} from './useDocumentUpload';
describe('useDocumentUpload', () => {
  it('현재 보이는 파일 탭의 입력만 분석 요청에 포함한다', () => {
    const { result } = renderHook(() => useDocumentUpload());
    const file = new File(['report'], 'report.pdf', { type: 'application/pdf' });
    act(() => result.current.dispatch({ type: 'file', value: file }));
    act(() => result.current.dispatch({ type: 'text', value: '숨겨진 직접 입력 내용' }));

    expect(result.current.createRequest()).toMatchObject({ file, text: undefined });
  });
  it('현재 보이는 직접 입력 탭의 내용만 분석 요청에 포함한다', () => {
    const { result } = renderHook(() => useDocumentUpload());
    const file = new File(['report'], 'report.pdf', { type: 'application/pdf' });
    act(() => result.current.dispatch({ type: 'file', value: file }));
    act(() => result.current.dispatch({ type: 'text', value: '  현재 보이는 내용  ' }));
    act(() => result.current.dispatch({ type: 'tab', value: 'text' }));

    expect(result.current.createRequest()).toMatchObject({
      file: undefined,
      text: '현재 보이는 내용',
    });
  });
  it('숨겨진 탭에만 값이 있으면 분석을 시작할 수 없다', () => {
    const { result } = renderHook(() => useDocumentUpload());
    act(() => result.current.dispatch({ type: 'text', value: '숨겨진 직접 입력 내용' }));

    expect(result.current.isValid).toBe(false);
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
  it('직접 입력은 60,000자를 넘겨 저장하지 않는다', () => {
    const { result } = renderHook(() => useDocumentUpload());
    act(() => result.current.dispatch({ type: 'text', value: '가'.repeat(MAX_TEXT_LENGTH + 10) }));
    expect(result.current.state.text).toHaveLength(MAX_TEXT_LENGTH);
  });
});
