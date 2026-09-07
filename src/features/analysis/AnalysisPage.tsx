import { Check, FileText, X } from 'lucide-react';
import { Button } from '../../components/ui';

const steps = ['문서 파싱', '구조 분석', '규정 매칭', '표현 검토', '점수 산출'];

export function AnalysisPage({
  filename,
  progress,
  step,
  onFail,
}: {
  filename: string;
  progress: number;
  step: string;
  onFail: () => void;
}) {
  const current = Math.max(0, steps.indexOf(step));

  return (
    <main className="analysis-page manuscript-analysis">
      <section className="analysis-sheet">
        <header className="analysis-sheet-head">
          <div>
            <span>DOCUMENT REVIEW</span>
            <small>BAREUM · AI REPORT COPILOT</small>
          </div>
          <b>{String(progress).padStart(3, '0')}%</b>
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
            <p className="document-kicker">{filename}</p>
            <h1>문서를 분석하고 있습니다</h1>
            <p>
              검토 항목과 관련 법령을 대조하고 있습니다.
              <br />
              완료될 때까지 이 화면을 유지해 주세요.
            </p>
            <div
              className="manuscript-progress"
              role="progressbar"
              aria-label="문서 분석 진행률"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <div style={{ width: `${progress}%` }} />
              <span>{step}</span>
            </div>
            <ol className="analysis-steps">
              {steps.map((label, index) => (
                <li
                  className={index < current ? 'done' : index === current ? 'active' : ''}
                  key={label}
                  aria-current={index === current ? 'step' : undefined}
                >
                  <span>{index < current ? <Check /> : String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <strong>{label}</strong>
                    <small>
                      {index < current ? '검토 완료' : index === current ? '검토 중' : '대기'}
                    </small>
                  </div>
                </li>
              ))}
            </ol>
            <Button variant="tertiary" onClick={onFail}>
              실패 화면 미리보기
            </Button>
          </div>
        </div>
        <footer>
          <span>참고용 / 법적 효력 없음</span>
          <span>NO. {new Date().getFullYear()}-01</span>
        </footer>
      </section>
    </main>
  );
}

export function FailedPage({
  onRetry,
  onDetail,
  message,
}: {
  onRetry: () => void;
  onDetail: () => void;
  message?: string;
}) {
  return (
    <main className="analysis-page">
      <span className="analysis-file failed">
        <X />
      </span>
      <p className="eyebrow">분석 중단</p>
      <h1>일부 검사를 완료하지 못했습니다</h1>
      <p>완료된 검사 결과는 보존되어 있습니다. 다시 분석하거나 세부 내용을 확인하세요.</p>
      <div className="failure-card">
        <strong>오류 코드 E-5001</strong>
        <dl>
          <div>
            <dt>발생 단계</dt>
            <dd>표현 검토</dd>
          </div>
          <div>
            <dt>발생 시간</dt>
            <dd>2026-09-06 12:43</dd>
          </div>
          <div>
            <dt>상세 내용</dt>
            <dd>{message ?? '외부 규정 조회 응답 시간이 초과되었습니다.'}</dd>
          </div>
        </dl>
      </div>
      <div className="button-row">
        <Button variant="secondary" onClick={onDetail}>
          부분 결과 보기
        </Button>
        <Button onClick={onRetry}>다시 분석</Button>
      </div>
    </main>
  );
}
