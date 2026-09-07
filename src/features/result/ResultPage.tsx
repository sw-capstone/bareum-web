import { useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronDown,
  Download,
  ExternalLink,
  FileBarChart,
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
  Save,
  X,
} from 'lucide-react';
import type { AnalysisResult, Issue, Severity } from '../../types';
import { Button, Modal } from '../../components/ui';
import { useIssueFilters } from '../../hooks/useIssueFilters';
import { useIssueWorkspace } from '../../hooks/useIssueWorkspace';
import { useSaveIssueChanges } from '../../hooks/useAnalysis';
const sev: { [K in Severity]: string } = {
  high: '높음',
  medium: '중간',
  low: '낮음',
  pending: '판단보류',
};
export function ResultPage({
  result,
  analysisId,
  onReport,
  onExport,
}: {
  result: AnalysisResult;
  analysisId: string;
  onReport: () => void;
  onExport: () => void;
}) {
  const [active, setActive] = useState<Issue | null>(null);
  const [section, setSection] = useState('s1');
  const [zoom, setZoom] = useState(100);
  const [fullscreen, setFullscreen] = useState(false);
  const workspace = useIssueWorkspace(result.issues);
  const filters = useIssueFilters(workspace.issues);
  const saveChanges = useSaveIssueChanges(analysisId);
  const filtered = filters.filteredIssues;
  const counts = useMemo(
    () =>
      workspace.issues.reduce(
        (a, i) => {
          if (i.status === 'open') a[i.level]++;
          return a;
        },
        { high: 0, medium: 0, low: 0, pending: 0 },
      ),
    [workspace.issues],
  );
  const resolved = workspace.issues.filter((i) => i.status === 'resolved').length;
  function update(issue: Issue, status: Issue['status']) {
    workspace.changeStatus(issue.id, status);
    setActive(null);
  }
  async function save() {
    await saveChanges.mutateAsync(workspace.changes);
    workspace.commit();
  }
  function select(i: Issue) {
    setActive(i);
    setSection(i.sectionId);
  }
  return (
    <main className="result-page">
      <div className="result-title">
        <h1>{result.title}</h1>
        <div className="result-title-actions">
          <Button size="sm" variant="secondary" onClick={onReport}>
            <FileBarChart />
            품질 리포트
          </Button>
          <Button size="sm" onClick={onExport}>
            <Download />
            내보내기
          </Button>
        </div>
      </div>
      <section className="score-strip">
        <Metric label="종합 점수" value={`${result.score}점`} />
        <Metric label="등급" value={result.grade} />
        <Metric label="높음" value={counts.high} tone="high" />
        <Metric label="중간" value={counts.medium} tone="medium" />
        <Metric label="낮음" value={counts.low} tone="low" />
        <Metric label="판단보류" value={counts.pending} />
        <div className="resolution">
          <span>해결 진행률</span>
          <strong>
            {workspace.issues.length}건 중 {resolved}건 해결
          </strong>
          <div>
            <i style={{ width: `${(resolved / workspace.issues.length) * 100}%` }} />
          </div>
          <small>{Math.round((resolved / workspace.issues.length) * 100)}%</small>
        </div>
      </section>
      <div className="dashboard">
        <aside className="toc panel">
          <h2>문서 목차</h2>
          {result.sections.map((s) => {
            const c = workspace.issues.filter(
              (i) => i.sectionId === s.id && i.status === 'open',
            ).length;
            return (
              <button
                className={section === s.id ? 'active' : ''}
                key={s.id}
                onClick={() => {
                  setSection(s.id);
                  document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span>
                  {s.number}. {s.title}
                </span>
                {c > 0 && <b>{c}</b>}
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
              <button onClick={() => setZoom(Math.max(80, zoom - 10))}>
                <Minus />
              </button>
              <b>{zoom}%</b>
              <button onClick={() => setZoom(Math.min(130, zoom + 10))}>
                <Plus />
              </button>
              <button aria-label="문서 전체보기" onClick={() => setFullscreen(true)}>
                <Maximize2 />
              </button>
            </div>
          </div>
          <div className="paper-wrap">
            <article
              className="paper"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            >
              <header>
                <h2>{result.title}</h2>
                <p>2026. 09. 05. · 축제기획팀</p>
              </header>
              {result.sections.map((s) => (
                <section id={s.id} key={s.id}>
                  <h3>
                    {s.number}. {s.title}
                  </h3>
                  {s.paragraphs.map((p, pi) => (
                    <p key={pi}>
                      {p.map((x, xi) =>
                        x.issueId ? (
                          <mark
                            key={xi}
                            className={x.level}
                            onClick={() =>
                              select(workspace.issues.find((i) => i.id === x.issueId)!)
                            }
                          >
                            {x.text}
                          </mark>
                        ) : (
                          x.text
                        ),
                      )}
                    </p>
                  ))}
                </section>
              ))}
            </article>
          </div>
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
            <span>{filtered.length}건</span>
          </div>
          <div className="filters">
            <label>
              <select
                value={filters.severity}
                onChange={(e) => filters.setSeverity(e.target.value as typeof filters.severity)}
              >
                <option value="all">전체 심각도</option>
                <option value="high">높음</option>
                <option value="medium">중간</option>
                <option value="low">낮음</option>
              </select>
              <ChevronDown />
            </label>
            <label>
              <select
                value={filters.status}
                onChange={(e) => filters.setStatus(e.target.value as typeof filters.status)}
              >
                <option value="all">해결 상태</option>
                <option value="open">미해결</option>
                <option value="resolved">해결됨</option>
              </select>
              <ChevronDown />
            </label>
          </div>
          <div className="issue-scroll">
            {filtered.map((i) => (
              <button className={`issue-card ${i.status}`} key={i.id} onClick={() => select(i)}>
                <div>
                  <Status level={i.level} />
                  <small>
                    {i.status === 'resolved'
                      ? '해결됨'
                      : i.status === 'ignored'
                        ? '무시됨'
                        : '미해결'}
                  </small>
                </div>
                <strong>{i.summary}</strong>
                <span>§ {i.section}</span>
              </button>
            ))}
          </div>
          <div className="savebar">
            <Button size="sm" variant="tertiary" onClick={workspace.revert}>
              <RotateCcw />
              되돌리기
            </Button>
            <Button size="sm" disabled={!workspace.isDirty || saveChanges.isPending} onClick={save}>
              <Save />
              {saveChanges.isPending ? '저장 중…' : workspace.isDirty ? '변경 내용 저장' : '저장됨'}
            </Button>
          </div>
        </aside>
      </div>
      <p className="disclaimer">
        참고용 / 법적 효력 없음. AI 검토 결과는 사람의 확인 후 반영해 주세요.
      </p>
      {active && (
        <Modal label={active.title} onClose={() => setActive(null)}>
          <div className="issue-modal-head">
            <Status level={active.level} />
            <h2>{active.title}</h2>
            <button onClick={() => setActive(null)}>
              <X />
            </button>
          </div>
          <div className="issue-modal-body">
            <Label title="원문">
              <blockquote>{active.original}</blockquote>
            </Label>
            <Label title="수정 제안">
              <div className="suggestion">{active.suggestion}</div>
            </Label>
            <Label title="이슈 설명">
              <p>{active.explanation}</p>
            </Label>
            <Label title="근거">
              {active.evidence.map((e) => (
                <div className="evidence" key={e.source}>
                  <BookOpen />
                  <div>
                    <strong>{e.source}</strong>
                    <p>{e.quote}</p>
                  </div>
                  <ExternalLink />
                </div>
              ))}
            </Label>
          </div>
          <div className="modal-actions">
            <Button variant="tertiary" onClick={() => update(active, 'ignored')}>
              무시
            </Button>
            <Button variant="secondary" onClick={() => setActive(null)}>
              닫기
            </Button>
            <Button onClick={() => update(active, 'resolved')}>
              <Check />
              제안 반영
            </Button>
          </div>
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
          <div className="fullscreen-paper-wrap">
            <article className="paper fullscreen-paper">
              <header>
                <h2>{result.title}</h2>
                <p>2026. 09. 05. · 축제기획팀</p>
              </header>
              {result.sections.map((documentSection) => (
                <section key={documentSection.id}>
                  <h3>
                    {documentSection.number}. {documentSection.title}
                  </h3>
                  {documentSection.paragraphs.map((paragraph, paragraphIndex) => (
                    <p key={paragraphIndex}>
                      {paragraph.map((segment, segmentIndex) =>
                        segment.issueId ? (
                          <mark
                            key={segmentIndex}
                            className={segment.level}
                            onClick={() =>
                              select(
                                workspace.issues.find((issue) => issue.id === segment.issueId)!,
                              )
                            }
                          >
                            {segment.text}
                          </mark>
                        ) : (
                          segment.text
                        ),
                      )}
                    </p>
                  ))}
                </section>
              ))}
            </article>
          </div>
        </Modal>
      )}
    </main>
  );
}
function Metric({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
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
      {sev[level]}
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
