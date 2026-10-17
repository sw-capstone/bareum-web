import { useRef, type ReactNode } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  LoaderCircle,
  RotateCcw,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { Button } from '../../components/ui';
import { MAX_TEXT_LENGTH, useDocumentUpload } from '../../hooks/useDocumentUpload';
import type { AnalysisRequest } from '../../services/analysisApi';

export function UploadPage({
  onAnalyze,
  isPending,
  analysisError,
}: {
  onAnalyze: (request: AnalysisRequest) => void;
  isPending?: boolean;
  analysisError?: boolean;
}) {
  const { state, dispatch, selectFile, removeFile, isValid, createRequest } = useDocumentUpload();
  const input = useRef<HTMLInputElement>(null);
  const isTextLimit = state.text.length >= MAX_TEXT_LENGTH;
  const isProcessing = state.fileStatus === 'processing';
  const analyze = () => isValid && onAnalyze(createRequest());

  return (
    <main className="page upload-page">
      <div className="page-heading">
        <h1>공공보고서 검토</h1>
        <p>검토할 문서를 올리거나 내용을 직접 입력해 주세요.</p>
      </div>
      <section className="upload-card">
        <div className="tabs" role="tablist" aria-label="문서 입력 방식">
          <button
            role="tab"
            aria-selected={state.tab === 'file'}
            className={state.tab === 'file' ? 'active' : ''}
            onClick={() => dispatch({ type: 'tab', value: 'file' })}
          >
            파일 업로드
          </button>
          <button
            role="tab"
            aria-selected={state.tab === 'text'}
            className={state.tab === 'text' ? 'active' : ''}
            onClick={() => dispatch({ type: 'tab', value: 'text' })}
          >
            직접 입력
          </button>
        </div>

        {state.tab === 'file' ? (
          !state.file ? (
            <>
              <input
                ref={input}
                hidden
                type="file"
                accept=".hwpx,.docx,.pdf"
                onChange={(event) => {
                  selectFile(event.target.files);
                  event.target.value = '';
                }}
              />
              <button
                type="button"
                className={`dropzone ${state.isDragging ? 'drag' : ''}`}
                onClick={() => input.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDragEnter={() => dispatch({ type: 'drag', value: true })}
                onDragLeave={() => dispatch({ type: 'drag', value: false })}
                onDrop={(event) => {
                  event.preventDefault();
                  dispatch({ type: 'drag', value: false });
                  selectFile(event.dataTransfer.files);
                }}
              >
                <span className="drop-icon">
                  <UploadCloud />
                </span>
                <h2>파일을 이곳에 올려주세요</h2>
                <p>HWPX, DOCX, PDF · 최대 20MB · 최대 60페이지</p>
                <span className="dropzone-hint">영역을 선택해 파일 찾기</span>
              </button>
              {state.fileError && (
                <NoticeCard title="파일 업로드에 실패했습니다." tone="error">
                  <p>{state.fileError}</p>
                  <Button variant="secondary" size="sm" onClick={() => input.current?.click()}>
                    <RotateCcw /> 다시 업로드
                  </Button>
                </NoticeCard>
              )}
            </>
          ) : (
            <div className={`uploaded-file ${isProcessing ? 'is-processing' : ''}`}>
              <span className="file-icon">
                <FileText />
              </span>
              <div>
                <strong>{state.file.name}</strong>
                <p className={isProcessing ? 'file-status processing' : 'file-status completed'}>
                  {isProcessing ? <LoaderCircle className="spinner" /> : <CheckCircle2 />}
                  {isProcessing ? '문서 업로드 중' : '업로드 완료'} <span>·</span>{' '}
                  {(state.file.size / 1024 / 1024).toFixed(2)}MB
                </p>
                {isProcessing && <small>문서 내용을 읽고 있습니다. 잠시만 기다려 주세요.</small>}
              </div>
              <Button variant="tertiary" onClick={removeFile} disabled={isProcessing}>
                <Trash2 /> 삭제
              </Button>
            </div>
          )
        ) : (
          <div className="editor">
            <div className="editor-toolbar">
              <strong>B</strong>
              <em>I</em>
              <span>제목</span>
              <span>문단</span>
              <span>번호</span>
              <span>글머리표</span>
              <small className={isTextLimit ? 'limit-reached' : ''}>
                {state.text.length.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()}자
              </small>
            </div>
            <textarea
              value={state.text}
              maxLength={MAX_TEXT_LENGTH}
              onChange={(event) => dispatch({ type: 'text', value: event.target.value })}
              placeholder="검토할 보고서 내용을 붙여 넣으세요."
              aria-describedby="text-input-help"
            />
            <p id="text-input-help" className="editor-help">
              공백과 줄바꿈을 포함해 최대 60,000자까지 입력할 수 있습니다.
            </p>
          </div>
        )}

        {analysisError && (
          <NoticeCard title="분석 요청을 시작하지 못했습니다." tone="error">
            <p>입력한 내용은 그대로 유지됩니다. 잠시 후 다시 시도해 주세요.</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={analyze}
              disabled={!isValid || isPending}
            >
              <RotateCcw /> 다시 시도
            </Button>
          </NoticeCard>
        )}

        <div className="document-config">
          <label className="select-field">
            <span>문서 유형</span>
            <select
              value={state.documentType}
              onChange={(event) => dispatch({ type: 'documentType', value: event.target.value })}
            >
              <option>계획 보고서</option>
              <option>결과 보고서</option>
            </select>
          </label>
        </div>
        <div className="submit-row">
          <p>검토 결과는 참고용이며 사람의 확인이 필요합니다.</p>
          <Button size="lg" disabled={!isValid || isPending || isProcessing} onClick={analyze}>
            {isPending ? '요청 중…' : isProcessing ? '문서 처리 중…' : '분석 시작'}
          </Button>
        </div>
      </section>
    </main>
  );
}

function NoticeCard({
  title,
  tone,
  children,
}: {
  title: string;
  tone: 'error' | 'warning';
  children: ReactNode;
}) {
  return (
    <aside className={`upload-notice ${tone}`} role="alert">
      <AlertCircle />
      <div>
        <strong>{title}</strong>
        {children}
      </div>
    </aside>
  );
}
