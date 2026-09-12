import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDocumentUpload } from './useDocumentUpload';
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
});
