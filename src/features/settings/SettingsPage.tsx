import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui';

export function SettingsPage({ onBack }: { onBack: () => void }) {
  return (
    <main className="page">
      <div className="settings-heading">
        <div className="page-heading">
          <h1>설정</h1>
          <p>계정과 서비스 사용 환경을 관리합니다.</p>
        </div>
        <Button size="sm" variant="secondary" onClick={onBack}>
          <ArrowLeft /> 이전 화면으로
        </Button>
      </div>
      <section className="upload-card settings-card">
        <h2>계정 설정</h2>
        <p>백엔드 계정 API가 연결되면 알림, 보안, 프로필 설정이 제공됩니다.</p>
      </section>
    </main>
  );
}
