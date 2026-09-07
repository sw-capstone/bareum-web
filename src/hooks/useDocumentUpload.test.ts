import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDocumentUpload } from './useDocumentUpload';
describe('useDocumentUpload', () => {
  it('전체 검사 선택 중에는 개별 검사 변경을 무시한다', () => {
    const { result } = renderHook(() => useDocumentUpload());
    expect(result.current.state.scopes).toEqual(['all']);
    act(() => result.current.dispatch({ type: 'toggleScope', value: 'format' }));
    expect(result.current.state.scopes).toEqual(['all']);
  });
  it('전체 검사를 해제하면 개별 검사를 선택할 수 있다', () => {
    const { result } = renderHook(() => useDocumentUpload());
    act(() => result.current.dispatch({ type: 'toggleScope', value: 'all' }));
    act(() => result.current.dispatch({ type: 'toggleScope', value: 'format' }));
    expect(result.current.state.scopes).toEqual(['format']);
  });
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
