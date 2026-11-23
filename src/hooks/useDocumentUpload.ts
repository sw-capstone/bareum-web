import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import type { AnalysisRequest } from '../services/analysisApi';

export const MAX_FILE_SIZE = 20 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = ['pdf', 'docx', 'hwpx'];

export type FileProcessingStatus = 'idle' | 'processing' | 'completed' | 'failed';

interface UploadState {
  file: File | null;
  fileStatus: FileProcessingStatus;
  fileError: string | null;
  documentType: string;
  isDragging: boolean;
}

type Action =
  | { type: 'file'; value: File | null }
  | { type: 'fileStatus'; value: FileProcessingStatus }
  | { type: 'fileError'; value: string | null }
  | { type: 'documentType'; value: string }
  | { type: 'drag'; value: boolean };

const initialState: UploadState = {
  file: null,
  fileStatus: 'idle',
  fileError: null,
  documentType: '계획 보고서',
  isDragging: false,
};

function reducer(state: UploadState, action: Action): UploadState {
  switch (action.type) {
    case 'file':
      return {
        ...state,
        file: action.value,
        fileStatus: action.value ? 'processing' : 'idle',
        fileError: null,
      };
    case 'fileStatus':
      return { ...state, fileStatus: action.value };
    case 'fileError':
      return { ...state, fileError: action.value, fileStatus: action.value ? 'failed' : 'idle' };
    case 'documentType':
      return { ...state, documentType: action.value };
    case 'drag':
      return { ...state, isDragging: action.value };
  }
}

export function validateFile(file: File): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !SUPPORTED_EXTENSIONS.includes(extension)) {
    return '지원하지 않는 파일 형식입니다. HWPX, DOCX, PDF 파일을 선택해 주세요.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return '파일 용량이 20MB를 초과했습니다. 제한 기준에 맞는 파일을 다시 업로드해 주세요.';
  }
  return null;
}

export function createAnalysisRequest(state: UploadState): AnalysisRequest {
  if (!state.file) throw new Error('분석할 파일을 선택해 주세요.');
  return {
    file: state.file,
    documentType: state.documentType,
  };
}

export function useDocumentUpload() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const processingTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (processingTimer.current) window.clearTimeout(processingTimer.current);
    },
    [],
  );

  const selectFile = useCallback((files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    if (processingTimer.current) window.clearTimeout(processingTimer.current);
    const error = validateFile(file);
    if (error) {
      dispatch({ type: 'file', value: null });
      dispatch({ type: 'fileError', value: error });
      return;
    }

    dispatch({ type: 'file', value: file });
    // TODO: 파일 사전 파싱 API 계약이 확정되면 이 타이머를 파싱 응답 상태로 교체한다.
    processingTimer.current = window.setTimeout(() => {
      dispatch({ type: 'fileStatus', value: 'completed' });
    }, 900);
  }, []);

  const removeFile = useCallback(() => {
    if (processingTimer.current) window.clearTimeout(processingTimer.current);
    dispatch({ type: 'file', value: null });
  }, []);

  const isValid = useMemo(
    () => Boolean(state.file && state.fileStatus === 'completed'),
    [state.file, state.fileStatus],
  );

  const createRequest = useCallback(() => createAnalysisRequest(state), [state]);

  return { state, dispatch, selectFile, removeFile, isValid, createRequest };
}
