import { ArrowLeft, Download } from 'lucide-react';
import type { AnalysisResult } from '../../types';
import { Button } from '../../components/ui';
export function ReportPage({
  result,
  onBack,
  onExport,
}: {
  result: AnalysisResult;
  onBack: () => void;
  onExport: () => void;
}) {
  return (
    <main className="page report-page">
      <div className="report-heading">
        <div>
          <h1>품질 리포트</h1>
        </div>
        <div>
          <Button size="sm" variant="secondary" onClick={onBack}>
            <ArrowLeft />
            수정 화면으로
          </Button>
          <Button size="sm" variant="secondary" onClick={onExport}>
            <Download />
            내보내기
          </Button>
        </div>
      </div>
      <section className="report-board">
        <div className="report-left">
          <div className="radar-card">
            <h2>품질 영역 분석</h2>
            <div className="radar">
              <svg viewBox="0 0 260 230" role="img" aria-label="품질 영역 점수 방사형 차트">
                <g transform="translate(130 115)">
                  {[1, 0.75, 0.5, 0.25].map((n) => (
                    <polygon
                      key={n}
                      points={`0,${-92 * n} ${87 * n},${-28 * n} ${54 * n},${75 * n} ${-54 * n},${75 * n} ${-87 * n},${-28 * n}`}
                      fill="none"
                      stroke="#c9d0da"
                    />
                  ))}
                  <polygon
                    points="0,-54 56,-18 38,53 -38,53 -48,-15"
                    fill="rgba(15,126,140,.12)"
                    stroke="#0f7e8c"
                    strokeWidth="2"
                  />
                </g>
              </svg>
              <span className="r1">
                규정 준수 <b>58</b>
              </span>
              <span className="r2">
                구조 완결성 <b>64</b>
              </span>
              <span className="r3">
                표현 품질 <b>71</b>
              </span>
              <span className="r4">
                근거·정합성 <b>55</b>
              </span>
            </div>
          </div>
          <div className="severity-summary">
            <h2>오류 심각도 요약</h2>
            {[
              ['high', '오류', 3],
              ['medium', '주의', 5],
              ['low', '개선', 4],
              ['pending', '보류', 1],
            ].map(([k, l, n]) => (
              <div key={String(k)}>
                <i className={String(k)} />
                <span>{l}</span>
                <b>{n}</b>
              </div>
            ))}
          </div>
          <div className="criteria">
            <strong>데이터 기준일</strong>
            <span>2026-09-05</span>
            <i />
          </div>
        </div>
        <div className="quality-score">
          <p>품질 점수</p>
          <strong>
            {result.score}
            <small>점</small>
          </strong>
          <div className="quality-grid">
            {[
              ['규정 준수', 58],
              ['구조 완결성', 64],
              ['표현 품질', 71],
              ['근거·정합성', 55],
            ].map(([l, n]) => (
              <div key={String(l)}>
                <span>{l}</span>
                <b>{n}</b>
                <i>
                  <em style={{ width: `${n}%` }} />
                </i>
              </div>
            ))}
          </div>
        </div>
      </section>
      <p className="disclaimer">
        참고용 / 법적 효력 없음. 분석 기준은 검토 시점에 따라 달라질 수 있습니다.
      </p>
    </main>
  );
}
