import { useCallback, useMemo, useReducer } from 'react';
import type { AnalysisRequest } from '../services/analysisApi';

type Tab = 'file' | 'text';
interface UploadState {
  tab: Tab;
  file: File | null;
  text: string;
  documentType: string;
  scopes: string[];
  maskingFields: string[];
  isDragging: boolean;
}
type Action =
  | { type: 'tab'; value: Tab }
  | { type: 'file'; value: File | null }
  | { type: 'text'; value: string }
  | { type: 'documentType'; value: string }
  | { type: 'toggleScope'; value: string }
  | { type: 'toggleMask'; value: string }
  | { type: 'drag'; value: boolean };

const initialState: UploadState = {
  tab: 'file',
  file: null,
  text: '',
  documentType: '계획 보고서',
  scopes: ['all'],
  maskingFields: ['rrn', 'phone', 'account'],
  isDragging: false,
};

function toggle(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

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
    case 'toggleScope':
      if (action.value === 'all') {
        return { ...state, scopes: state.scopes.includes('all') ? [] : ['all'] };
      }
      if (state.scopes.includes('all')) return state;
      return { ...state, scopes: toggle(state.scopes, action.value) };
    case 'toggleMask':
      return { ...state, maskingFields: toggle(state.maskingFields, action.value) };
    case 'drag':
      return { ...state, isDragging: action.value };
  }
}

export function createAnalysisRequest(
  state: UploadState,
  maskingFields = state.maskingFields,
): AnalysisRequest {
  return {
    file: state.tab === 'file' ? (state.file ?? undefined) : undefined,
    text: state.tab === 'text' ? state.text.trim() || undefined : undefined,
    documentType: state.documentType,
    scopes: state.scopes,
    maskingFields,
  };
}

export function useDocumentUpload() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const selectFile = useCallback((files: FileList | null) => {
    if (files?.[0]) dispatch({ type: 'file', value: files[0] });
  }, []);
  const isValid = useMemo(
    () => Boolean(state.tab === 'file' ? state.file : state.text.trim()) && state.scopes.length > 0,
    [state.file, state.scopes.length, state.tab, state.text],
  );

  const createRequest = useCallback(
    (maskingFields = state.maskingFields) => createAnalysisRequest(state, maskingFields),
    [state],
  );

  return { state, dispatch, selectFile, isValid, createRequest };
}
