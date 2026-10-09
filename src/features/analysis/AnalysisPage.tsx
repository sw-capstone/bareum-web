import { useState } from 'react';
import { AlertTriangle, Check, FileText, LoaderCircle, X } from 'lucide-react';
import { Button, Modal } from '../../components/ui';
import type { AnalysisCheck, AnalysisProgress } from '../../services/contracts';

const defaultCheckLabels = ['구조', '규정', '표현', '정합성', '수정안', '점수'];

function fallbackChecks(step: string, progress: number): AnalysisCheck[] {
  const matchingIndex = defaultCheckLabels.findIndex((label) => step.includes(label));
  const activeIndex = matchingIndex >= 0 ? matchingIndex : Math.min(5, Math.floor(progress / 17));
  return defaultCheckLabels.map((label, index) => ({
    id: label,
    label,
    status: index < activeIndex ? 'completed' : index === activeIndex ? 'processing' : 'pending',
  }));
}

export function AnalysisPage({
  analysis,
  onCancel,
  cancelPending,
  cancelError,
  pausePending,
  pauseError,
  resumePending,
  resumeError,
  onPause,
  onResume,
  onCancelDialogChange,
  onViewResult,
}: {
  analysis: AnalysisProgress;
  onCancel: () => void;
  cancelPending?: boolean;
  cancelError?: string;
  pausePending?: boolean;
  pauseError?: string;
  resumePending?: boolean;
  resumeError?: string;
  onPause?: () => void;
  onResume?: () => void;
  onCancelDialogChange?: (open: boolean) => void;
  onViewResult: () => void;
}) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const checks = analysis.checks?.length
    ? analysis.checks
    : fallbackChecks(analysis.step, analysis.progress);
  const currentCheck = checks.find((check) => check.status === 'processing');
  const completedCount = checks.filter((check) => check.status === 'completed').length;
  const openCancelDialog = () => {
    setCancelOpen(true);
    onCancelDialogChange?.(true);
    onPause?.();
  };
  const closeCancelDialog = () => {
    if (cancelPending || pausePending || resumePending) return;
    onResume?.();
    onCancelDialogChange?.(false);
    setCancelOpen(false);
  };

  return (
    <main className="analysis-page manuscript-analysis">
      <section className="analysis-sheet">
        <header className="analysis-sheet-head">
          <div>
            <span>DOCUMENT REVIEW</span>
            <small>BAREUM · AI REPORT COPILOT</small>
          </div>
          <b>{String(Math.round(analysis.progress)).padStart(3, '0')}%</b>
        </header>
        <div className="analysis-sheet-body">
          <div className="analysis-vertical-title">
            <span>문</span>
            <span>서</span>
            <i />
            <span>검</span>
            <span>토</span>
          </div>
          <div className="analysis-main">
            <span className="analysis-file">
              <FileText />
            </span>
            <h1>문서를 분석하고 있습니다</h1>
            <p>새로고침하거나 다른 화면으로 이동해도 서버의 분석은 계속됩니다.</p>
            <div
              className="manuscript-progress"
              role="progressbar"
              aria-label="문서 분석 진행률"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={analysis.progress}
            >
              <div style={{ width: `${analysis.progress}%` }} />
              <span>{currentCheck ? `${currentCheck.label} 검사 중` : analysis.step}</span>
            </div>
            <ol className="analysis-steps analysis-steps--six">
              {checks.map((check, index) => (
                <li
                  className={check.status}
                  key={check.id}
                  aria-current={check.status === 'processing' ? 'step' : undefined}
                >
                  <span>
                    {check.status === 'completed' ? <Check /> : null}
                    {check.status === 'failed' ? <X /> : null}
                    {check.status === 'processing' ? <LoaderCircle className="spinner" /> : null}
                    {check.status === 'pending' ? String(index + 1).padStart(2, '0') : null}
                  </span>
                  <div>
                    <strong>{check.label}</strong>
                    <small>
                      {check.status === 'completed' && '검사 완료'}
                      {check.status === 'failed' && '검사 실패'}
                      {check.status === 'processing' && '검사 중'}
                      {check.status === 'pending' && '대기'}
                    </small>
                  </div>
                </li>
              ))}
            </ol>
            <div className="analysis-current-status" aria-live="polite">
              <LoaderCircle className="spinner" />
              <div>
                <strong>
                  {currentCheck ? `${currentCheck.label} 검사를 수행하고 있습니다` : analysis.step}
                </strong>
                <span>
                  {completedCount} / {checks.length}개 검사 완료
                </span>
              </div>
            </div>
            <div className="analysis-actions">
              <Button variant="danger" onClick={openCancelDialog}>
                분석 취소
              </Button>
            </div>
          </div>
        </div>
        <footer>
          <span>참고용 / 법적 효력 없음</span>
          <span>
            {analysis.documentType ?? '공공보고서'} · NO. {new Date().getFullYear()}-01
          </span>
        </footer>
      </section>

      {cancelOpen && (
        <Modal onClose={closeCancelDialog} label="분석 취소 확인" className="cancel-modal">
          <div className="modal-head">
            <span className="modal-icon warning">
              <AlertTriangle />
            </span>
            <div>
              <h2>분석을 취소하시겠습니까?</h2>
              <p>취소하면 지금까지 생성된 검사 결과가 모두 폐기됩니다.</p>
            </div>
          </div>
          {(pauseError || resumeError) && (
            <div className="cancel-error" role="alert">
              <strong>{pauseError ?? resumeError}</strong>
            </div>
          )}
          {cancelError && (
            <div className="cancel-error" role="alert">
              <strong>{cancelError}</strong>
              <Button size="sm" variant="secondary" onClick={onViewResult}>
                결과 보기
              </Button>
            </div>
          )}
          <div className="modal-actions">
            <Button
              variant="secondary"
              onClick={closeCancelDialog}
              disabled={cancelPending || pausePending || resumePending}
            >
              {pausePending ? '일시 정지 중…' : resumePending ? '분석 재개 중…' : '닫기'}
            </Button>
            <Button variant="danger" onClick={onCancel} disabled={cancelPending || pausePending}>
              {cancelPending ? '취소 처리 중…' : '분석 취소'}
            </Button>
          </div>
        </Modal>
      )}
    </main>
  );
}

export function FailedPage({
  analysis,
  onRetry,
  onPartialResult,
  onCancel,
  retryPending,
}: {
  analysis: AnalysisProgress;
  onRetry: () => void;
  onPartialResult: () => void;
  onCancel: () => void;
  retryPending?: boolean;
}) {
  const isPartial = analysis.status === 'partial_failed';
  const failures = analysis.checks?.filter((check) => check.status === 'failed') ?? [];

  return (
    <main className="analysis-page failure-page">
      <span className="analysis-file failed">{isPartial ? <AlertTriangle /> : <X />}</span>
      <p className="eyebrow">{isPartial ? '분석 부분 실패' : '분석 전체 실패'}</p>
      <h1>{isPartial ? '일부 검사를 완료하지 못했습니다' : '분석에 실패했습니다'}</h1>
      <p>
        {isPartial
          ? '완료된 검사 결과는 확인할 수 있습니다. 실패한 항목과 사유를 확인해 주세요.'
          : '전체 검사에 실패하여 분석 결과를 제공할 수 없습니다.'}
      </p>
      <span className="failure-document-type">{analysis.documentType ?? '계획 보고서'}</span>

      <div className="failure-card">
        <strong>
          {isPartial
            ? `${failures.length || 1}개 검사 영역을 완료하지 못했습니다.`
            : (analysis.errorMessage ?? '전체 검사에 실패하여 분석 결과를 제공할 수 없습니다.')}
        </strong>
        <dl>
          {(failures.length
            ? failures
            : [
                {
                  id: 'analysis',
                  label: '전체 분석',
                  status: 'failed' as const,
                  errorCode: analysis.errorCode,
                  errorMessage: analysis.errorMessage,
                },
              ]
          ).map((failure) => (
            <div className="failure-detail" key={failure.id}>
              <dt>{failure.label}</dt>
              <dd>
                <span>{failure.failedAt ?? '발생 시간 정보 없음'}</span>
                <b>{failure.errorCode ?? analysis.errorCode ?? 'ANALYSIS_FAILED'}</b>
                <p>
                  {failure.errorMessage ??
                    analysis.errorMessage ??
                    '검사 처리 중 오류가 발생했습니다.'}
                </p>
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="button-row">
        {isPartial ? (
          <Button variant="secondary" onClick={onPartialResult}>
            부분 결과 보기
          </Button>
        ) : (
          <Button variant="secondary" onClick={onCancel}>
            분석 취소
          </Button>
        )}
        <Button onClick={onRetry} disabled={retryPending}>
          {retryPending ? '다시 분석 중…' : '다시 분석'}
        </Button>
      </div>
    </main>
  );
}
