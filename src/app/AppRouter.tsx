import { useEffect, useState } from 'react';
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router-dom';
import { Header } from '../components/Header';
import { PageError, PageLoading } from '../components/AsyncState';
import { useSession } from '../contexts/session';
import { useAnalysisProgress, useAnalysisResult, useStartAnalysis } from '../hooks/useAnalysis';
import type { Screen } from '../types';
import { LoginPage } from '../features/auth/LoginPage';
import { UploadPage } from '../features/upload/UploadPage';
import { AnalysisPage, FailedPage } from '../features/analysis/AnalysisPage';
import { ResultPage } from '../features/result/ResultPage';
import { ReportPage } from '../features/report/ReportPage';
import { ExportDialog } from '../features/export/ExportDialog';
import { SettingsPage } from '../features/settings/SettingsPage';
import type { ExportKind } from '../services/exportApi';

function screenFor(pathname: string): Screen {
  if (pathname.startsWith('/settings')) return 'settings';
  if (pathname.startsWith('/analyses/') && pathname.endsWith('/report')) return 'report';
  if (pathname.startsWith('/analyses/') && pathname.endsWith('/result')) return 'dashboard';
  if (pathname.startsWith('/analyses/') && pathname.endsWith('/failed')) return 'failed';
  if (pathname.startsWith('/analyses/')) return 'analyzing';
  return 'upload';
}
function AppShell() {
  const { user, logout } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [exportOpen, setExportOpen] = useState(false);
  const [exportKind, setExportKind] = useState<ExportKind>('document');
  const screen = screenFor(location.pathname);
  const id = location.pathname.split('/')[2] || 'analysis-demo';
  const exportResult = useAnalysisResult(screen === 'dashboard' || screen === 'report' ? id : '');
  const openExport = (kind: ExportKind) => {
    setExportKind(kind);
    setExportOpen(true);
  };
  return (
    <>
      <Header
        user={user}
        screen={screen}
        onNavigate={(s) => {
          if (s === 'settings') {
            navigate('/settings', { state: { from: location.pathname } });
            return;
          }
          navigate(s === 'upload' ? '/upload' : '/');
        }}
        onLogout={() => {
          logout();
          navigate('/login');
        }}
      />
      <Outlet context={{ openExport }} />
      {exportOpen && exportResult.data && (
        <ExportDialog
          result={exportResult.data}
          initialKind={exportKind}
          onClose={() => setExportOpen(false)}
        />
      )}
    </>
  );
}
function LoginRoute() {
  const { login } = useSession();
  const navigate = useNavigate();
  return (
    <LoginPage
      onLogin={(user) => {
        login(user);
        navigate('/upload');
      }}
    />
  );
}
function UploadRoute() {
  const navigate = useNavigate();
  const start = useStartAnalysis();
  return (
    <>
      <UploadPage
        isPending={start.isPending}
        onAnalyze={(request) =>
          start.mutate(request, {
            onSuccess: ({ analysisId }) => navigate(`/analyses/${analysisId}`),
          })
        }
      />
      {start.isError && (
        <div role="alert" className="request-error">
          분석 요청을 시작하지 못했습니다. 다시 시도해 주세요.
        </div>
      )}
    </>
  );
}
function AnalysisRoute() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const progress = useAnalysisProgress(id);
  useEffect(() => {
    if (progress.data?.status === 'completed')
      navigate(`/analyses/${id}/result`, { replace: true });
    if (progress.data?.status === 'failed') navigate(`/analyses/${id}/failed`, { replace: true });
  }, [id, navigate, progress.data?.status]);
  if (progress.isError) return <PageError onRetry={() => progress.refetch()} />;
  return (
    <AnalysisPage
      filename="갯벌축제_계획_v3.hwpx"
      progress={Math.round(progress.data?.progress ?? 0)}
      step={progress.data?.step ?? '문서 파싱'}
      onFail={() => navigate(`/analyses/${id}/failed`)}
    />
  );
}
function FailureRoute() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  return (
    <FailedPage
      onRetry={() => navigate(`/analyses/${id}`)}
      onDetail={() => navigate(`/analyses/${id}/result`)}
    />
  );
}
function SettingsRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const destination = from && !from.startsWith('/settings') ? from : '/upload';

  return <SettingsPage onBack={() => navigate(destination, { replace: true })} />;
}
function ResultRoute() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { openExport } = useOutletContext<{ openExport: (kind: ExportKind) => void }>();
  const query = useAnalysisResult(id);
  if (query.isLoading) return <PageLoading label="분석 결과를 불러오고 있습니다" />;
  if (query.isError || !query.data) return <PageError onRetry={() => query.refetch()} />;
  return (
    <ResultPage
      result={query.data}
      analysisId={id}
      onReport={() => navigate(`/analyses/${id}/report`)}
      onExport={() => openExport('document')}
    />
  );
}
function ReportRoute() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { openExport } = useOutletContext<{ openExport: (kind: ExportKind) => void }>();
  const query = useAnalysisResult(id);
  if (query.isLoading) return <PageLoading />;
  if (query.isError || !query.data) return <PageError onRetry={() => query.refetch()} />;
  return (
    <ReportPage
      result={query.data}
      onBack={() => navigate(`/analyses/${id}/result`)}
      onExport={() => openExport('report')}
    />
  );
}
export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route element={<AppShell />}>
        <Route path="/upload" element={<UploadRoute />} />
        <Route path="/settings" element={<SettingsRoute />} />
        <Route path="/analyses/:id" element={<AnalysisRoute />} />
        <Route path="/analyses/:id/failed" element={<FailureRoute />} />
        <Route path="/analyses/:id/result" element={<ResultRoute />} />
        <Route path="/analyses/:id/report" element={<ReportRoute />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
