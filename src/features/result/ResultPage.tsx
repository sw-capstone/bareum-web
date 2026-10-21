import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ExternalLink,
  FileCheck2,
  HelpCircle,
  Maximize2,
  Minus,
  Plus,
  RefreshCw,
  X,
} from 'lucide-react';
import type { AnalysisResult, Issue, Severity } from '../../types';
import { Button, Modal } from '../../components/ui';
import { useIssueFilters } from '../../hooks/useIssueFilters';
import { useIssueWorkspace } from '../../hooks/useIssueWorkspace';
import { useRegenerateSuggestion, useSaveIssueChanges } from '../../hooks/useAnalysis';
import { ExportMenu } from '../export/ExportDialog';

const severityLabels: Record<Severity, string> = {
  high: '높음',
  medium: '중간',
  low: '낮음',
  pending: '판단보류',
};

export function ResultPage({
  result,
  analysisId,
  onFinish,
}: {
  result: AnalysisResult;
  analysisId: string;
  onFinish: () => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [section, setSection] = useState(result.sections[0]?.id ?? '');
  const [zoom, setZoom] = useState(100);
  const [fullscreen, setFullscreen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [finishProgress, setFinishProgress] = useState(0);
  const [finishComplete, setFinishComplete] = useState(false);
  const workspace = useIssueWorkspace(result.issues);
  const filters = useIssueFilters(workspace.issues);
  const active = workspace.issues.find((issue) => issue.id === activeId) ?? null;
  const openIssues = workspace.issues.filter((issue) => issue.status === 'open');
  const handled = workspace.issues.length - openIssues.length;
  const progress = workspace.issues.length
    ? Math.round((handled / workspace.issues.length) * 100)
    : 100;
  const counts = useMemo(
    () =>
      workspace.issues.reduce(
        (current, issue) => ({ ...current, [issue.level]: current[issue.level] + 1 }),
        { high: 0, medium: 0, low: 0, pending: 0 },
      ),
    [workspace.issues],
  );

  useEffect(() => {
    if (!finishOpen || finishComplete) return;
    const timer = window.setInterval(() => {
      setFinishProgress((current) => {
        if (current < 90) return current + 10;
        window.clearInterval(timer);
        setFinishComplete(true);
        onFinish();
        return 100;
      });
    }, 100);
    return () => window.clearInterval(timer);
  }, [finishComplete, finishOpen, onFinish]);

  function selectIssue(issue: Issue) {
    setActiveId(issue.id);
    if (issue.sectionId) setSection(issue.sectionId);
  }

  function renderedSegment(text: string, issueId?: string) {
    const issue = workspace.issues.find((item) => item.id === issueId);
    return issue?.status === 'resolved' && issue.appliedText ? issue.appliedText : text;
  }

  return (
    <main className="result-page">
      <div className="result-title">
        <div>
          <h1>분석 결과</h1>
          <p>
            {openIssues.length
              ? `확인이 필요한 이슈가 ${openIssues.length}건 남아 있습니다.`
              : '모든 이슈를 확인했습니다.'}
          </p>
        </div>
        <div className="result-title-actions">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setFinishProgress(0);
              setFinishComplete(false);
              setFinishOpen(true);
            }}
          >
            <FileCheck2 />
            수정 끝내기
          </Button>
          <ExportMenu result={result} />
        </div>
      </div>

      <section className="score-strip" aria-label="이슈 요약">
        <Metric label="높음" value={counts.high} tone="high" />
        <Metric label="중간" value={counts.medium} tone="medium" />
        <Metric label="낮음" value={counts.low} tone="low" />
        <Metric label="판단보류" value={counts.pending} />
        <div className="resolution">
          <span>해결 진행률</span>
          <strong>
            {workspace.issues.length}건 중 {handled}건 확인
          </strong>
          <div>
            <i style={{ width: `${progress}%` }} />
          </div>
          <small>{progress}%</small>
        </div>
      </section>

      <div className="dashboard">
        <aside className="toc panel">
          <h2>문서 목차</h2>
          {workspace.issues.some((issue) => !issue.location) && (
            <button className={!section ? 'active' : ''} onClick={() => setSection('')}>
              <span>문서 전체 이슈</span>
              <b>
                {
                  workspace.issues.filter((issue) => !issue.location && issue.status === 'open')
                    .length
                }
              </b>
            </button>
          )}
          {result.sections.map((item) => {
            const count = workspace.issues.filter(
              (issue) => issue.sectionId === item.id && issue.status === 'open',
            ).length;
            return (
              <button
                className={section === item.id ? 'active' : ''}
                key={item.id}
                onClick={() => {
                  setSection(item.id);
                  document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span>
                  {item.number}. {item.title}
                </span>
                {count > 0 && <b>{count}</b>}
              </button>
            );
          })}
        </aside>

        <section className="document panel">
          <div className="document-bar">
            <span>
              <strong>{result.title}</strong> · {result.filename}
            </span>
            <div>
              <button aria-label="축소" onClick={() => setZoom(Math.max(80, zoom - 10))}>
                <Minus />
              </button>
              <b>{zoom}%</b>
              <button aria-label="확대" onClick={() => setZoom(Math.min(130, zoom + 10))}>
                <Plus />
              </button>
              <button aria-label="문서 전체보기" onClick={() => setFullscreen(true)}>
                <Maximize2 />
              </button>
            </div>
          </div>
          <DocumentPaper
            result={result}
            issues={workspace.issues}
            zoom={zoom}
            onIssue={selectIssue}
            renderText={renderedSegment}
          />
          <div className="legend">
            <span className="high">높음</span>
            <span className="medium">중간</span>
            <span className="low">낮음</span>
            <span>판단보류</span>
          </div>
        </section>

        <aside className="issues panel">
          <div className="issues-head">
            <h2>이슈 목록</h2>
            <span>{filters.filteredIssues.length}건</span>
          </div>
          <div className="filters">
            <label>
              <select
                value={filters.severity}
                onChange={(event) =>
                  filters.setSeverity(event.target.value as typeof filters.severity)
                }
              >
                <option value="all">전체 심각도</option>
                <option value="high">높음</option>
                <option value="medium">중간</option>
                <option value="low">낮음</option>
                <option value="pending">판단보류</option>
              </select>
              <ChevronDown />
            </label>
            <label>
              <select
                value={filters.status}
                onChange={(event) => filters.setStatus(event.target.value as typeof filters.status)}
              >
                <option value="all">처리 상태</option>
                <option value="open">미해결</option>
                <option value="resolved">해결</option>
                <option value="ignored">무시</option>
              </select>
              <ChevronDown />
            </label>
          </div>
          <div className="issue-scroll">
            {filters.filteredIssues.map((issue) => (
              <button
                className={`issue-card ${issue.status}`}
                key={issue.id}
                onClick={() => selectIssue(issue)}
              >
                <div>
                  <Status level={issue.level} />
                  <small>{statusLabel(issue.status)}</small>
                </div>
                <strong>{issue.summary}</strong>
                <span>
                  {issue.location ?? '문서 전체'}
                  <b>상세 보기</b>
                </span>
              </button>
            ))}
          </div>
        </aside>
      </div>

      <p className="disclaimer">
        분석 결과는 참고용이며 법적 효력이 없습니다. 최종 반영 전 반드시 내용을 확인해 주세요.
      </p>

      {active && (
        <IssueDetail
          issue={active}
          analysisId={analysisId}
          onClose={() => setActiveId(null)}
          onSaved={(patch) => workspace.updateIssue(active.id, patch)}
        />
      )}
      {finishOpen && (
        <Modal
          label="분석 완료"
          className="finish-analysis-modal"
          onClose={() => {
            if (finishComplete) setFinishOpen(false);
          }}
        >
          <div className="finish-analysis-body">
            <span className={`finish-analysis-icon ${finishComplete ? 'complete' : ''}`}>
              <FileCheck2 />
            </span>
            <h2>
              {finishComplete ? '분석이 완료되었습니다' : '최종 분석 리포트를 생성하고 있습니다'}
            </h2>
            <p>
              {finishComplete
                ? '분석 기록이 저장되었습니다. 내 분석 기록에서 언제든 다시 확인할 수 있습니다.'
                : '현재까지 반영된 수정사항을 바탕으로 결과를 정리하고 있습니다.'}
            </p>
            <div className="finish-progress" aria-label="리포트 생성 진행률">
              <i style={{ width: `${finishProgress}%` }} />
            </div>
            <strong>{finishProgress}%</strong>
          </div>
          {finishComplete && (
            <div className="modal-actions">
              <Button onClick={() => setFinishOpen(false)}>완료</Button>
            </div>
          )}
        </Modal>
      )}
      {fullscreen && (
        <Modal
          className="document-modal"
          label="문서 전체보기"
          onClose={() => setFullscreen(false)}
        >
          <div className="document-modal-head">
            <div>
              <strong>{result.title}</strong>
              <span>{result.filename}</span>
            </div>
            <button aria-label="전체보기 닫기" onClick={() => setFullscreen(false)}>
              <X />
            </button>
          </div>
          <DocumentPaper
            result={result}
            issues={workspace.issues}
            onIssue={selectIssue}
            renderText={renderedSegment}
            fullscreen
          />
        </Modal>
      )}
    </main>
  );
}

function IssueDetail({
  issue,
  analysisId,
  onClose,
  onSaved,
}: {
  issue: Issue;
  analysisId: string;
  onClose: () => void;
  onSaved: (patch: Partial<Issue>) => void;
}) {
  const save = useSaveIssueChanges(analysisId);
  const regenerate = useRegenerateSuggestion(analysisId);
  const [suggestion, setSuggestion] = useState(issue.suggestion);
  const [draft, setDraft] = useState(issue.appliedText ?? '');
  const [error, setError] = useState('');
  const isLocked = issue.status === 'resolved' || issue.status === 'ignored';
  const canApply = issue.suggestionAvailable !== false && Boolean(draft.trim());

  async function persist(patch: Partial<Issue>, closeAfterSave = false) {
    setError('');
    try {
      await save.mutateAsync({ issueId: issue.id, patch });
      onSaved(patch);
      if (closeAfterSave) onClose();
    } catch {
      setError('변경 사항을 저장하지 못했습니다. 입력 내용은 유지됩니다. 다시 시도해 주세요.');
    }
  }

  return (
    <Modal className="issue-detail-modal" label={issue.title} onClose={onClose}>
      <div className="issue-modal-head">
        <Status level={issue.level} />
        <div>
          <h2>{issue.title}</h2>
          <p>
            {issue.checkArea ?? '종합 검사'} · {issue.location ?? '문서 전체'}
          </p>
        </div>
        <button aria-label="닫기" onClick={onClose}>
          <X />
        </button>
      </div>
      <div className="issue-modal-body">
        <Label title="원문">
          <blockquote>{issue.original || '문서 내 특정 위치가 없는 전체 이슈입니다.'}</blockquote>
        </Label>
        {issue.level === 'pending' ? (
          <>
            <Label title="보류 사유">
              <p>{issue.pendingReason ?? issue.explanation}</p>
            </Label>
            <Label title="사용자 확인 사항">
              <ul className="verification-list">
                {(issue.userChecks ?? ['관련 근거와 사실관계를 직접 확인해 주세요.']).map(
                  (item) => (
                    <li key={item}>{item}</li>
                  ),
                )}
              </ul>
            </Label>
          </>
        ) : (
          <Label title="이슈 설명">
            <p>{issue.explanation}</p>
          </Label>
        )}
        {issue.evidence.length > 0 && (
          <Label title="관련 근거">
            {issue.evidence.map((evidence) => (
              <div className="evidence" key={`${evidence.source}-${evidence.quote}`}>
                <BookOpen />
                <div>
                  <span>{evidence.type ?? '기타'}</span>
                  <strong>{evidence.source}</strong>
                  <p>{evidence.quote}</p>
                </div>
                {evidence.url && (
                  <a
                    href={evidence.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${evidence.source} 원문 열기`}
                  >
                    <ExternalLink />
                  </a>
                )}
              </div>
            ))}
          </Label>
        )}
        {issue.suggestionAvailable !== false && issue.level !== 'pending' && (
          <Label title="수정안">
            <div className="suggestion-toolbar">
              <span>
                {issue.canRegenerate === false ? (
                  <>
                    <HelpCircle /> 규칙에 따라 정해진 수정안입니다.
                  </>
                ) : (
                  '새 수정안은 적용하기 전까지 본문에 반영되지 않습니다.'
                )}
              </span>
              <Button
                size="sm"
                variant="tertiary"
                disabled={isLocked || issue.canRegenerate === false || regenerate.isPending}
                onClick={async () => {
                  const response = await regenerate.mutateAsync(issue.id);
                  setSuggestion(response.suggestion);
                }}
              >
                <RefreshCw />
                다른 수정안 받기
              </Button>
              <Button
                size="sm"
                disabled={isLocked || !suggestion.trim()}
                onClick={() => setDraft(suggestion)}
              >
                수정안 적용
              </Button>
            </div>
            <div className="suggestion-preview">{suggestion}</div>
          </Label>
        )}
        <Label title="최종 적용 문장">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            aria-label="최종 적용 문장"
            disabled={isLocked || (issue.level === 'pending' && !issue.location)}
          />
          {issue.level === 'pending' && !issue.location && (
            <p className="field-help">
              문서 내 위치를 특정할 수 없는 판단 보류 이슈는 문장을 직접 수정할 수 없습니다.
            </p>
          )}
        </Label>
        {error && (
          <div className="inline-error" role="alert">
            {error}
          </div>
        )}
      </div>
      <div className="modal-actions split-actions">
        <Button variant="tertiary" onClick={onClose}>
          닫기
        </Button>
        <div>
          <Button
            variant="secondary"
            disabled={save.isPending}
            onClick={() =>
              persist({ status: issue.status === 'ignored' ? 'open' : 'ignored' }, true)
            }
          >
            {issue.status === 'ignored' ? '무시 해제' : '무시'}
          </Button>
          <Button
            disabled={
              save.isPending ||
              issue.status === 'ignored' ||
              (!canApply && issue.status !== 'resolved')
            }
            onClick={() =>
              issue.status === 'resolved'
                ? persist({ status: 'open', appliedText: null })
                : persist({ status: 'resolved', appliedText: draft }, true)
            }
          >
            {save.isPending ? '저장 중…' : issue.status === 'resolved' ? '적용 취소' : '적용'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function DocumentPaper({
  result,
  issues,
  onIssue,
  renderText,
  zoom = 100,
  fullscreen = false,
}: {
  result: AnalysisResult;
  issues: Issue[];
  onIssue: (issue: Issue) => void;
  renderText: (text: string, issueId?: string) => string;
  zoom?: number;
  fullscreen?: boolean;
}) {
  return (
    <div className={fullscreen ? 'fullscreen-paper-wrap' : 'paper-wrap'}>
      <article
        className={`paper ${fullscreen ? 'fullscreen-paper' : ''}`}
        style={
          fullscreen
            ? undefined
            : { transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }
        }
      >
        <header>
          <h2>{result.title}</h2>
          <p>{result.reviewedAt} · 검토 작업본</p>
        </header>
        {result.sections.map((documentSection) => (
          <section id={fullscreen ? undefined : documentSection.id} key={documentSection.id}>
            <h3>
              {documentSection.number}. {documentSection.title}
            </h3>
            {documentSection.paragraphs.map((paragraph, paragraphIndex) => (
              <p key={paragraphIndex}>
                {paragraph.map((segment, segmentIndex) => {
                  const issue = issues.find((item) => item.id === segment.issueId);
                  const level = issue?.level ?? segment.level;
                  return issue ? (
                    <mark
                      key={segmentIndex}
                      className={`${level} ${issue.status}`}
                      onClick={() => onIssue(issue)}
                    >
                      {renderText(segment.text, segment.issueId)}
                    </mark>
                  ) : (
                    segment.text
                  );
                })}
              </p>
            ))}
          </section>
        ))}
      </article>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong className={tone}>{value}</strong>
    </div>
  );
}
function Status({ level }: { level: Severity }) {
  return (
    <span className={`status ${level}`}>
      <i />
      {severityLabels[level]}
    </span>
  );
}
function Label({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="modal-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}
function statusLabel(status: Issue['status']) {
  return status === 'resolved' ? '해결' : status === 'ignored' ? '무시' : '미해결';
}
