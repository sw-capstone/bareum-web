import { useCallback, useMemo, useReducer } from 'react';
import type { AnalysisRequest } from '../services/analysisApi';

type Tab = 'file' | 'text';
interface UploadState {
  tab: Tab;
  file: File | null;
  text: string;
  documentType: string;
  isDragging: boolean;
}
type Action =
  | { type: 'tab'; value: Tab }
  | { type: 'file'; value: File | null }
  | { type: 'text'; value: string }
  | { type: 'documentType'; value: string }
  | { type: 'drag'; value: boolean };

const initialState: UploadState = {
  tab: 'file',
  file: null,
  text: '',
  documentType: '계획 보고서',
  isDragging: false,
};

function reducer(state: UploadState, action: Action): UploadState {
  switch (action.type) {
    case 'tab':
      return { ...state, tab: action.value };
    case 'file':
      return { ...state, file: action.value };
    case 'text':
      return { ...state, text: action.value };
    case 'documentType':
      return { ...state, documentType: action.value };
    case 'drag':
      return { ...state, isDragging: action.value };
  }
}

export function createAnalysisRequest(state: UploadState): AnalysisRequest {
  return {
    file: state.tab === 'file' ? (state.file ?? undefined) : undefined,
    text: state.tab === 'text' ? state.text.trim() || undefined : undefined,
    documentType: state.documentType,
  };
}

export function useDocumentUpload() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const selectFile = useCallback((files: FileList | null) => {
    if (files?.[0]) dispatch({ type: 'file', value: files[0] });
  }, []);
  const isValid = useMemo(
    () => Boolean(state.tab === 'file' ? state.file : state.text.trim()),
    [state.file, state.tab, state.text],
  );

  const createRequest = useCallback(() => createAnalysisRequest(state), [state]);

  return { state, dispatch, selectFile, isValid, createRequest };
}
