import { useRef, useState } from 'react';
import { CheckCircle2, FileText, Trash2, UploadCloud } from 'lucide-react';
import { Button, Checkbox, Modal } from '../../components/ui';
import { useDocumentUpload } from '../../hooks/useDocumentUpload';
import type { AnalysisRequest } from '../../services/analysisApi';

const scopeLabels = [
  ['all', '전체 검사'],
  ['format', '형식 및 목차'],
  ['content', '내용 요건'],
  ['number', '수치 및 데이터'],
  ['rule', '참고 규정 준수'],
  ['etc', '기타 검토 항목'],
];
const maskLabels = [
  ['rrn', '주민등록번호'],
  ['phone', '휴대전화'],
  ['account', '계좌번호'],
];

export function UploadPage({
  onAnalyze,
  isPending,
}: {
  onAnalyze: (request: AnalysisRequest) => void;
  isPending?: boolean;
}) {
  const { state, dispatch, selectFile, isValid, createRequest } = useDocumentUpload();
  const [maskOpen, setMaskOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  function start(maskingFields = state.maskingFields) {
    onAnalyze(createRequest(maskingFields));
    setMaskOpen(false);
  }

  return (
    <main className="page upload-page">
      <div className="page-heading">
        <h1>공공보고서 검토</h1>
        <p>검토할 문서를 올리고 검사 범위를 설정하세요.</p>
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
        <div className="config-grid">
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
          <div className="scope">
            <span>검사 범위</span>
            <div>
              {scopeLabels.map(([key, label]) => (
                <Checkbox
                  key={key}
                  label={label}
                  checked={state.scopes.includes(key)}
                  disabled={state.scopes.includes('all') && key !== 'all'}
                  onChange={() => dispatch({ type: 'toggleScope', value: key })}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="submit-row">
          <p>검토 결과는 참고용이며 사람의 확인이 필요합니다.</p>
          <Button size="lg" disabled={!isValid || isPending} onClick={() => setMaskOpen(true)}>
            {isPending ? '요청 중…' : '분석 시작'}
          </Button>
        </div>
      </section>
      {maskOpen && (
        <Modal
          className="manuscript-modal"
          label="개인정보 마스킹"
          onClose={() => setMaskOpen(false)}
        >
          <div className="mask-title-area">
            <div>
              <h2>
                개인정보를
                <br />
                마스킹하시겠습니까?
              </h2>
              <p>선택한 정보는 문서 분석 전에 안전하게 가려집니다.</p>
            </div>
            <span className="privacy-stamp">보호</span>
          </div>
          <div className="mask-options">
            <div className="mask-options-head">
              <span>마스킹 대상</span>
              <span>선택</span>
            </div>
            {maskLabels.map(([key, label], index) => (
              <div className="mask-row" key={key}>
                <span className="mask-number">0{index + 1}</span>
                <div>
                  <strong>{label}</strong>
                  <small>
                    {key === 'rrn'
                      ? '생년월일 및 식별번호'
                      : key === 'phone'
                        ? '개인 연락처 정보'
                        : '금융 식별 정보'}
                  </small>
                </div>
                <Checkbox
                  checked={state.maskingFields.includes(key)}
                  onChange={() => dispatch({ type: 'toggleMask', value: key })}
                  label=""
                />
              </div>
            ))}
          </div>
          <div className="modal-actions">
            <Button variant="tertiary" onClick={() => setMaskOpen(false)}>
              취소
            </Button>
            <Button variant="secondary" onClick={() => start([])}>
              그대로 진행
            </Button>
            <Button onClick={() => start()}>마스킹 후 분석</Button>
          </div>
        </Modal>
      )}
    </main>
  );
}
