import { CheckCircle2, Clock3, ExternalLink, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui';
import type { RecentAnalysis } from './recentAnalysis';

export function LoginManagementPage({ onBack }: { onBack: () => void }) {
  return (
    <main className="page account-page">
      <div className="page-heading">
        <h1>구글 로그인 관리</h1>
        <p>바름에 연결된 로그인 계정을 확인하고 관리합니다.</p>
      </div>
      <section className="upload-card account-card">
        <div className="account-provider-icon">
          <ShieldCheck />
        </div>
        <div>
          <h2>Google 계정 연결됨</h2>
          <p>현재 계정은 Google 로그인을 사용하고 있습니다.</p>
        </div>
        <Button size="sm" variant="secondary">
          <ExternalLink /> Google에서 관리
        </Button>
      </section>
      <Button variant="tertiary" onClick={onBack}>
        이전 화면으로
      </Button>
    </main>
  );
}

export function AnalysisHistoryPage({
  recent,
  onOpen,
}: {
  recent: RecentAnalysis | null;
  onOpen: (recent: RecentAnalysis) => void;
}) {
  return (
    <main className="page account-page">
      <div className="page-heading">
        <h1>내 분석 기록</h1>
        <p>최근 진행한 문서 분석을 확인합니다.</p>
      </div>
      <section className="upload-card history-card">
        {recent ? (
          <button className="history-item" onClick={() => onOpen(recent)}>
            <span className="history-item-icon">
              {recent.status === 'result' ? <CheckCircle2 /> : <Clock3 />}
            </span>
            <span>
              <strong>최근 분석</strong>
              <small>
                {recent.status === 'result' ? '분석 완료 · 결과 확인 가능' : '분석 진행 중'}
              </small>
            </span>
            <b>{recent.status === 'result' ? '결과 보기' : '진행 상황 보기'}</b>
          </button>
        ) : (
          <div className="history-empty">
            <Clock3 />
            <h2>아직 분석 기록이 없습니다</h2>
            <p>문서를 업로드하고 분석을 시작하면 이곳에서 확인할 수 있습니다.</p>
          </div>
        )}
      </section>
    </main>
  );
}
