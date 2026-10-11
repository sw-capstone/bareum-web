import { CheckCircle2, Clock3, ExternalLink, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui';
import type { AnalysisRecord } from './recentAnalysis';

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
  records,
  onOpen,
}: {
  records: AnalysisRecord[];
  onOpen: (record: AnalysisRecord) => void;
}) {
  return (
    <main className="page account-page">
      <div className="page-heading">
        <h1>내 분석 기록</h1>
        <p>최근 진행한 문서 분석을 확인합니다.</p>
      </div>
      <section className="upload-card history-card">
        {records.length ? (
          records.map((record) => (
            <button className="history-item" key={record.id} onClick={() => onOpen(record)}>
              <span className="history-item-icon">
                <CheckCircle2 />
              </span>
              <span>
                <strong>{record.title}</strong>
                <small>
                  {record.filename} · {new Date(record.completedAt).toLocaleDateString('ko-KR')}
                </small>
              </span>
              <b>결과 보기</b>
            </button>
          ))
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
