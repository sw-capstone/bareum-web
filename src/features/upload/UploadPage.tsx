import { useRef } from 'react';
import { CheckCircle2, FileText, Trash2, UploadCloud } from 'lucide-react';
import { Button } from '../../components/ui';
import { useDocumentUpload } from '../../hooks/useDocumentUpload';
import type { AnalysisRequest } from '../../services/analysisApi';

export function UploadPage({
  onAnalyze,
  isPending,
}: {
  onAnalyze: (request: AnalysisRequest) => void;
  isPending?: boolean;
}) {
  const { state, dispatch, selectFile, isValid, createRequest } = useDocumentUpload();
  const input = useRef<HTMLInputElement>(null);

  return (
    <main className="page upload-page">
      <div className="page-heading">
        <h1>공공보고서 검토</h1>
        <p>검토할 문서를 올려주세요.</p>
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
                onChange={(e) => selectFile(e.target.files)}
              />
              <button
                type="button"
                className={`dropzone ${state.isDragging ? 'drag' : ''}`}
                onClick={() => input.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={() => dispatch({ type: 'drag', value: true })}
                onDragLeave={() => dispatch({ type: 'drag', value: false })}
                onDrop={(e) => {
                  e.preventDefault();
                  dispatch({ type: 'drag', value: false });
                  selectFile(e.dataTransfer.files);
                }}
              >
                <span className="drop-icon">
                  <UploadCloud />
                </span>
                <h2>파일을 이곳에 올려주세요</h2>
                <p>HWPX, DOCX, PDF · 최대 20MB</p>
                <span className="dropzone-hint">영역을 선택해 파일 찾기</span>
              </button>
            </>
          ) : (
            <div className="uploaded-file">
              <span className="file-icon">
                <FileText />
              </span>
              <div>
                <strong>{state.file.name}</strong>
                <p>
                  <CheckCircle2 /> 업로드 완료 <span>·</span>{' '}
                  {(state.file.size / 1024 / 1024).toFixed(2)}MB
                </p>
              </div>
              <Button variant="tertiary" onClick={() => dispatch({ type: 'file', value: null })}>
                <Trash2 />
                삭제
              </Button>
            </div>
          )
        ) : (
          <div className="editor">
            <div className="editor-toolbar">
              <strong>B</strong>
              <em>I</em>
              <span>문단</span>
              <span>목록</span>
              <span>링크</span>
              <small>{state.text.length.toLocaleString()} / 30,000자</small>
            </div>
            <textarea
              value={state.text}
              maxLength={30000}
              onChange={(e) => dispatch({ type: 'text', value: e.target.value })}
              placeholder="검토할 보고서 내용을 붙여 넣으세요."
            />
          </div>
        )}
        <div className="document-config">
          <label className="select-field">
            <span>문서 유형</span>
            <select
              value={state.documentType}
              onChange={(e) => dispatch({ type: 'documentType', value: e.target.value })}
            >
              <option>계획 보고서</option>
              <option>결과 보고서</option>
            </select>
          </label>
        </div>
        <div className="submit-row">
          <p>검토 결과는 참고용이며 사람의 확인이 필요합니다.</p>
          <Button
            size="lg"
            disabled={!isValid || isPending}
            onClick={() => onAnalyze(createRequest())}
          >
            {isPending ? '요청 중…' : '분석 시작'}
          </Button>
        </div>
      </section>
    </main>
  );
}
