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
import {
  useAnalysisProgress,
  useAnalysisResult,
  useCancelAnalysis,
  usePauseAnalysis,
  useResumeAnalysis,
  useRetryAnalysis,
  useStartAnalysis,
} from '../hooks/useAnalysis';
import type { Screen } from '../types';
import { LoginPage } from '../features/auth/LoginPage';
import { PasswordResetPage } from '../features/auth/PasswordResetPage';
import { SignupPage } from '../features/auth/SignupPage';
import { TermsPage } from '../features/auth/TermsPage';
import { useSignupFlow } from '../features/auth/signupFlow';
import { UploadPage } from '../features/upload/UploadPage';
import { AnalysisPage, FailedPage } from '../features/analysis/AnalysisPage';
import { ResultPage } from '../features/result/ResultPage';
import { ReportPage } from '../features/report/ReportPage';
import { ExportDialog } from '../features/export/ExportDialog';
import { SettingsPage } from '../features/settings/SettingsPage';
import type { ExportKind } from '../services/exportApi';
import { authApi } from '../services/authApi';
import { ApiError } from '../services/httpClient';

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
        onLogout={async () => {
          try {
            await authApi.logout();
          } finally {
            logout();
            navigate('/login');
          }
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
function RequireSession() {
  const { user } = useSession();
  if (!user) return <Navigate to="/login" replace />;
  return <AppShell />;
}
function LoginRoute() {
  const { login } = useSession();
  const { clearDraft } = useSignupFlow();
  const navigate = useNavigate();
  useEffect(() => clearDraft(), [clearDraft]);
  return (
    <LoginPage
      onForgotPassword={() => navigate('/forgot-password')}
      onLogin={async (credentials) => {
        const user = await authApi.login(credentials);
        login(user);
        navigate('/upload');
      }}
      onSignup={() => navigate('/signup')}
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
        analysisError={start.isError}
        onAnalyze={(request) =>
          start.mutate(request, {
            onSuccess: ({ analysisId }) => navigate(`/analyses/${analysisId}`),
          })
        }
      />
    </>
  );
}
function AnalysisRoute() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const progress = useAnalysisProgress(id);
  const cancel = useCancelAnalysis();
  const pause = usePauseAnalysis();
  const resume = useResumeAnalysis();
  useEffect(() => {
    if (!isCancelDialogOpen && progress.data?.status === 'completed')
      navigate(`/analyses/${id}/result`, { replace: true });
    if (
      !isCancelDialogOpen &&
      (progress.data?.status === 'partial_failed' || progress.data?.status === 'failed')
    )
      navigate(`/analyses/${id}/failed`, { replace: true });
    if (progress.data?.status === 'canceled') navigate('/upload', { replace: true });
  }, [id, isCancelDialogOpen, navigate, progress.data?.status]);
  if (progress.isError) return <PageError onRetry={() => progress.refetch()} />;
  const analysis = progress.data ?? {
    status: 'queued' as const,
    progress: 0,
    step: '분석 요청을 접수하고 있습니다',
  };
  const cancelError = cancel.error
    ? cancel.error instanceof ApiError && cancel.error.code === 'ANALYSIS_ALREADY_COMPLETED'
      ? '분석이 이미 완료되어 취소할 수 없습니다.'
      : '분석 취소 요청을 처리하지 못했습니다. 다시 시도해 주세요.'
    : undefined;
  return (
    <AnalysisPage
      analysis={analysis}
      cancelPending={cancel.isPending}
      cancelError={cancelError}
      pausePending={pause.isPending}
      pauseError={pause.isError ? '분석을 일시 정지하지 못했습니다.' : undefined}
      resumePending={resume.isPending}
      resumeError={resume.isError ? '분석을 다시 시작하지 못했습니다.' : undefined}
      onCancelDialogChange={setIsCancelDialogOpen}
      onPause={() => pause.mutate(id)}
      onResume={() => resume.mutate(id)}
      onViewResult={() => navigate(`/analyses/${id}/result`)}
      onCancel={() =>
        cancel.mutate(id, {
          onSuccess: () => navigate('/upload', { replace: true }),
        })
      }
    />
  );
}
function FailureRoute() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const progress = useAnalysisProgress(id);
  const retry = useRetryAnalysis();
  if (progress.isLoading) return <PageLoading label="실패 정보를 불러오고 있습니다" />;
  if (progress.isError || !progress.data) return <PageError onRetry={() => progress.refetch()} />;
  return (
    <FailedPage
      analysis={progress.data}
      retryPending={retry.isPending}
      onRetry={() =>
        retry.mutate(id, {
          onSuccess: ({ analysisId }) => navigate(`/analyses/${analysisId}`, { replace: true }),
        })
      }
      onPartialResult={() => navigate(`/analyses/${id}/result`)}
      onCancel={() => navigate('/upload', { replace: true })}
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
      key={id}
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
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/forgot-password" element={<PasswordResetPage />} />
      <Route element={<RequireSession />}>
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
