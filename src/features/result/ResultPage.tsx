import { useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import {
  ChevronDown,
  ExternalLink,
  FileText,
  Maximize2,
  Minus,
  ListTree,
  Plus,
  X,
} from 'lucide-react';
import type { AnalysisResult, Issue, Severity } from '../../types';
import { Button, Modal } from '../../components/ui';
import { useIssueFilters } from '../../hooks/useIssueFilters';
import { useIssueConfirmation } from '../../hooks/useIssueConfirmation';
import {
  resultReportApi,
  ResultReportUnavailableError,
  type ResultReport,
} from '../../services/resultReportApi';

const severityLabels: Record<Severity, string> = {
  high: '높음',
  medium: '중간',
  low: '낮음',
  pending: '판단보류',
};

export function ResultPage({
  result,
  reportGenerationFailed = false,
}: {
  result: AnalysisResult;
  reportGenerationFailed?: boolean;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [section, setSection] = useState(result.sections[0]?.id ?? '');
  const [tocOpen, setTocOpen] = useState(false);
  const documentScrollRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const previousCardPositions = useRef(new Map<string, DOMRect>());
  const [zoom, setZoom] = useState(100);
  const [fullscreen, setFullscreen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportState, setReportState] = useState<
    'idle' | 'loading' | 'ready' | 'error' | 'unavailable'
  >('idle');
  const [report, setReport] = useState<ResultReport | null>(null);
  const confirmation = useIssueConfirmation(result.issues);
  const filters = useIssueFilters(confirmation.orderedIssues);
  const pendingIssues = confirmation.orderedIssues.filter((issue) => issue.level === 'pending');
  const active = result.issues.find((issue) => issue.id === activeId) ?? null;
  const handled = result.issues.filter((issue) => confirmation.confirmed.has(issue.id)).length;
  const remaining = result.issues.length - handled;
  const progress = result.issues.length ? Math.round((handled / result.issues.length) * 100) : 100;
  const counts = useMemo(
    () =>
      result.issues.reduce(
        (current, issue) => ({ ...current, [issue.level]: current[issue.level] + 1 }),
        { high: 0, medium: 0, low: 0, pending: 0 },
      ),
    [result.issues],
  );

  useLayoutEffect(() => {
    const previous = previousCardPositions.current;
    if (!previous.size) return;
    previousCardPositions.current = new Map();
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    dashboardRef.current
      ?.querySelectorAll<HTMLElement>('.issue-card[data-issue-id]')
      .forEach((card) => {
        const before = previous.get(card.dataset.issueId ?? '');
        if (!before) return;
        const after = card.getBoundingClientRect();
        const x = before.left - after.left;
        const y = before.top - after.top;
        if (Math.abs(x) < 1 && Math.abs(y) < 1) return;
        card.animate?.(
          [{ transform: `translate(${x}px, ${y}px)` }, { transform: 'translate(0, 0)' }],
          { duration: 420, easing: 'cubic-bezier(0.42, 0, 0.58, 1)' },
        );
      });
  }, [confirmation.orderedIssues]);

  function changeIssueConfirmation(issueId: string, confirmOnly = false) {
    if (confirmOnly && confirmation.confirmed.has(issueId)) return;
    const positions = new Map<string, DOMRect>();
    dashboardRef.current
      ?.querySelectorAll<HTMLElement>('.issue-card[data-issue-id]')
      .forEach((card) => {
        if (card.dataset.issueId) positions.set(card.dataset.issueId, card.getBoundingClientRect());
      });
    previousCardPositions.current = positions;
    if (confirmOnly) confirmation.confirm(issueId);
    else confirmation.toggle(issueId);
  }

  async function openReport() {
    setReportOpen(true);
    if (reportGenerationFailed || reportState === 'ready') return;
    setReportState('loading');
    try {
      const data = await resultReportApi.get(result.id, result);
      setReport(data);
      setReportState('ready');
    } catch (error) {
      setReportState(error instanceof ResultReportUnavailableError ? 'unavailable' : 'error');
    }
  }

  function selectIssue(issue: Issue) {
    setActiveId(issue.id);
    if (issue.sectionId) setSection(issue.sectionId);
  }

  function goToSection(sectionId: string) {
    setSection(sectionId);
    const scroller = documentScrollRef.current;
    if (!scroller) return;
    if (!sectionId) {
      scroller.scrollTo?.({ top: 0, behavior: 'smooth' });
      return;
    }
    const target = Array.from(scroller.querySelectorAll<HTMLElement>('.paper section')).find(
      (item) => item.id === sectionId,
    );
    if (!target) return;
    scroller.scrollTo?.({
      top:
        scroller.scrollTop +
        target.getBoundingClientRect().top -
        scroller.getBoundingClientRect().top -
        26,
      behavior: 'smooth',
    });
  }

  return (
    <main className="result-page">
      <div className="result-title">
        <div>
          <h1>분석 결과</h1>
          <p>
            {remaining
              ? `확인이 필요한 이슈가 ${remaining}건 남아 있습니다.`
              : '모든 이슈를 확인했습니다.'}
          </p>
        </div>
        <div className="result-title-actions">
          <Button size="sm" onClick={openReport}>
            <FileText />
            결과 리포트
          </Button>
        </div>
      </div>

      <section className="score-strip" aria-label="이슈 요약">
        <Metric label="높음" value={counts.high} tone="high" />
        <Metric label="중간" value={counts.medium} tone="medium" />
        <Metric label="낮음" value={counts.low} tone="low" />
        <Metric label="판단보류" value={counts.pending} />
        <div className="resolution">
          <span>확인 진행률</span>
          <strong>
            {result.issues.length}건 중 {handled}건 확인
          </strong>
          <div>
            <i style={{ width: `${progress}%` }} />
          </div>
          <small>{progress}%</small>
        </div>
      </section>

      <div ref={dashboardRef} className={`dashboard${tocOpen ? ' dashboard--toc-open' : ''}`}>
        <aside className="toc panel" id="result-toc" aria-label="문서 목차" hidden={!tocOpen}>
          <h2>문서 목차</h2>
          {result.issues.some((issue) => !issue.location) && (
            <button className={!section ? 'active' : ''} onClick={() => goToSection('')}>
              <span>문서 전체 이슈</span>
              <b>
                {
                  result.issues.filter(
                    (issue) => !issue.location && !confirmation.confirmed.has(issue.id),
                  ).length
                }
              </b>
            </button>
          )}
          {result.sections.map((item) => {
            const count = result.issues.filter(
              (issue) => issue.sectionId === item.id && !confirmation.confirmed.has(issue.id),
            ).length;
            return (
              <button
                className={section === item.id ? 'active' : ''}
                key={item.id}
                onClick={() => goToSection(item.id)}
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
            <button
              type="button"
              className={`document-toc-toggle${tocOpen ? ' is-open' : ''}`}
              aria-label={tocOpen ? '문서 목차 닫기' : '문서 목차 열기'}
              aria-expanded={tocOpen}
              aria-controls="result-toc"
              onClick={() => setTocOpen((current) => !current)}
            >
              <ListTree aria-hidden="true" />
              <span>목차</span>
            </button>
            <span className="document-bar__title">
              <strong>{result.title}</strong> · {result.filename}
            </span>
            <div className="document-zoom">
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
            issues={result.issues}
            zoom={zoom}
            onIssue={selectIssue}
            scrollContainerRef={documentScrollRef}
          />
          <div className="legend">
            <span className="high">높음</span>
            <span className="medium">중간</span>
            <span className="low">낮음</span>
            <span>판단보류</span>
          </div>
        </section>

        <aside className="issue-column" aria-label="분석 이슈">
          <section className="pending-issues panel" aria-labelledby="pending-issues-heading">
            <div className="issues-head">
              <h2 id="pending-issues-heading">판단 보류</h2>
              <span>{pendingIssues.length}건</span>
            </div>
            <div className="issue-scroll">
              {pendingIssues.length ? (
                pendingIssues.map((issue) => (
                  <IssueCard
                    issue={issue}
                    key={issue.id}
                    confirmed={confirmation.confirmed.has(issue.id)}
                    onToggle={() => changeIssueConfirmation(issue.id)}
                    onSelect={selectIssue}
                  />
                ))
              ) : (
                <p className="issue-empty">판단 보류 이슈가 없습니다.</p>
              )}
            </div>
          </section>

          <section className="issues panel" aria-labelledby="regular-issues-heading">
            <div className="issues-head">
              <h2 id="regular-issues-heading">이슈 목록</h2>
              <span>{filters.filteredIssues.length}건</span>
            </div>
            <div className="filters">
              <label>
                <select
                  aria-label="심각도"
                  value={filters.severity}
                  onChange={(event) =>
                    filters.setSeverity(event.target.value as typeof filters.severity)
                  }
                >
                  <option value="all">전체 심각도</option>
                  <option value="high">높음</option>
                  <option value="medium">중간</option>
                  <option value="low">낮음</option>
                </select>
                <ChevronDown />
              </label>
            </div>
            <div className="issue-scroll">
              {filters.filteredIssues.length ? (
                filters.filteredIssues.map((issue) => (
                  <IssueCard
                    issue={issue}
                    key={issue.id}
                    confirmed={confirmation.confirmed.has(issue.id)}
                    onToggle={() => changeIssueConfirmation(issue.id)}
                    onSelect={selectIssue}
                  />
                ))
              ) : (
                <p className="issue-empty">해당하는 이슈가 없습니다.</p>
              )}
            </div>
          </section>
        </aside>
      </div>

      <p className="disclaimer">
        분석 결과는 참고용이며 법적 효력이 없습니다. 제안 내용을 원본 문서에 반영할지는 직접 판단해
        주세요.
      </p>

      {active && (
        <IssueDetail
          issue={active}
          onClose={() => setActiveId(null)}
          onConfirm={() => {
            changeIssueConfirmation(active.id, true);
            setActiveId(null);
          }}
        />
      )}
      {reportOpen && (
        <Modal
          label="결과 리포트"
          className="result-report-modal"
          onClose={() => setReportOpen(false)}
        >
          <div className="result-report-head">
            <div>
              <h2>결과 리포트</h2>
              <p>{result.title}</p>
            </div>
            <button
              type="button"
              aria-label="결과 리포트 닫기"
              onClick={() => setReportOpen(false)}
            >
              <X />
            </button>
          </div>
          {reportGenerationFailed ? (
            <div className="result-report-message" role="alert">
              <h3>결과 리포트 생성에 실패했습니다</h3>
              <p>분석 결과는 확인할 수 있지만 리포트는 아직 준비되지 않았습니다.</p>
            </div>
          ) : reportState === 'loading' ? (
            <div className="result-report-message" role="status">
              결과 리포트를 불러오고 있습니다.
            </div>
          ) : reportState === 'unavailable' ? (
            <div className="result-report-message" role="alert">
              <h3>결과 리포트 조회를 준비 중입니다</h3>
              <p>서버의 리포트 조회 기능이 연결되면 이곳에서 확인할 수 있습니다.</p>
            </div>
          ) : reportState === 'error' ? (
            <div className="result-report-message" role="alert">
              <h3>결과 리포트를 불러오지 못했습니다</h3>
              <p>잠시 후 다시 시도해 주세요.</p>
              <Button variant="secondary" onClick={openReport}>
                다시 시도
              </Button>
            </div>
          ) : report ? (
            <div className="result-report-content">
              <div className="result-report-summary">
                <div>
                  <span>종합 점수</span>
                  <strong>{report.score}점</strong>
                </div>
                <div>
                  <span>평가 등급</span>
                  <strong>{report.grade}</strong>
                </div>
                <div>
                  <span>발견한 이슈</span>
                  <strong>{report.findings.length}건</strong>
                </div>
              </div>
              <h3>검토 결과</h3>
              <p>
                높음 {report.issueCounts.high}건 · 중간 {report.issueCounts.medium}건 · 낮음{' '}
                {report.issueCounts.low}건 · 판단 보류 {report.issueCounts.pending}건
              </p>
              <div className="result-report-findings">
                {report.findings.map((finding) => (
                  <section key={finding.id}>
                    <h4>{finding.title}</h4>
                    <p>{finding.explanation}</p>
                    {finding.suggestion && (
                      <p>
                        <strong>수정 제안</strong> {finding.suggestion}
                      </p>
                    )}
                  </section>
                ))}
              </div>
            </div>
          ) : null}
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
          <DocumentPaper result={result} issues={result.issues} onIssue={selectIssue} fullscreen />
        </Modal>
      )}
    </main>
  );
}

function IssueDetail({
  issue,
  onClose,
  onConfirm,
}: {
  issue: Issue;
  onClose: () => void;
  onConfirm: () => void;
}) {
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
        {issue.suggestionAvailable !== false &&
          issue.level !== 'pending' &&
          Boolean(issue.suggestion.trim()) && (
            <Label title="수정안">
              <div className="suggestion-preview">{issue.suggestion}</div>
            </Label>
          )}
      </div>
      <div className="modal-actions">
        <Button onClick={onConfirm}>확인</Button>
      </div>
    </Modal>
  );
}

function DocumentPaper({
  result,
  issues,
  onIssue,
  zoom = 100,
  fullscreen = false,
  scrollContainerRef,
}: {
  result: AnalysisResult;
  issues: Issue[];
  onIssue: (issue: Issue) => void;
  zoom?: number;
  fullscreen?: boolean;
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className={fullscreen ? 'fullscreen-paper-wrap' : 'paper-wrap'} ref={scrollContainerRef}>
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
                    <mark key={segmentIndex} className={level} onClick={() => onIssue(issue)}>
                      {segment.text}
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
function IssueCard({
  issue,
  confirmed,
  onToggle,
  onSelect,
}: {
  issue: Issue;
  confirmed: boolean;
  onToggle: () => void;
  onSelect: (issue: Issue) => void;
}) {
  const description =
    issue.level === 'pending'
      ? issue.pendingReason?.trim() || issue.explanation?.trim() || issue.summary
      : issue.suggestionAvailable === false
        ? issue.summary
        : issue.suggestion?.trim() || issue.summary;

  return (
    <article className={`issue-card${confirmed ? ' is-confirmed' : ''}`} data-issue-id={issue.id}>
      <div className="issue-card__top">
        <Status level={issue.level} />
        <button
          type="button"
          role="switch"
          aria-label={`${issue.title} 확인`}
          aria-checked={confirmed}
          className="issue-confirmation"
          onClick={onToggle}
        >
          <span aria-hidden="true" />
        </button>
      </div>
      <button type="button" className="issue-card__details" onClick={() => onSelect(issue)}>
        <strong>{description}</strong>
        <span>
          {issue.location ?? '문서 전체'}
          <b>상세 보기</b>
        </span>
      </button>
    </article>
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
      <div className="modal-section-title">
        <h3>{title}</h3>
      </div>
      {children}
    </section>
  );
}
