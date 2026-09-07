import { Button } from './ui';
export function PageLoading({ label = '불러오는 중입니다' }: { label?: string }) {
  return (
    <main className="analysis-page" aria-live="polite">
      <div className="progress">
        <div style={{ width: '45%' }} />
      </div>
      <p className="analysis-status">{label}</p>
    </main>
  );
}
export function PageError({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <main className="analysis-page">
      <p className="eyebrow">요청 오류</p>
      <h1>정보를 불러오지 못했습니다</h1>
      <p>{message ?? '네트워크 연결을 확인한 후 다시 시도해 주세요.'}</p>
      {onRetry && <Button onClick={onRetry}>다시 시도</Button>}
    </main>
  );
}
