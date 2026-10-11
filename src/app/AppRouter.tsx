import { useCallback, useEffect, useState } from 'react';
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
import { Button, Modal } from '../components/ui';
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
import { ExportDialog } from '../features/export/ExportDialog';
import { SettingsPage } from '../features/settings/SettingsPage';
import { AnalysisHistoryPage, LoginManagementPage } from '../features/account/AccountPages';
import {
  getRecentAnalysis,
  getAnalysisRecords,
  completeAnalysis,
  RECENT_ANALYSIS_EVENT,
  setRecentAnalysis,
  type RecentAnalysis,
} from '../features/account/recentAnalysis';
import type { ExportKind } from '../services/exportApi';
import { authApi } from '../services/authApi';
import { ApiError } from '../services/httpClient';

function screenFor(pathname: string): Screen {
  if (pathname === '/history') return 'history';
  if (pathname === '/settings/login-management') return 'loginManagement';
  if (pathname.startsWith('/settings')) return 'settings';
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
  const [recentAnalysis, setRecentAnalysisState] = useState<RecentAnalysis | null>(() =>
    getRecentAnalysis(),
  );
  const [pendingNavigation, setPendingNavigation] = useState<Screen | null>(null);
  useEffect(() => {
    const update = () => setRecentAnalysisState(getRecentAnalysis());
    window.addEventListener(RECENT_ANALYSIS_EVENT, update);
    return () => window.removeEventListener(RECENT_ANALYSIS_EVENT, update);
  }, []);
  const screen = screenFor(location.pathname);
  const id = location.pathname.split('/')[2] || 'analysis-demo';
  const isUnfinishedResult =
    screen === 'dashboard' && recentAnalysis?.id === id && recentAnalysis.status === 'result';
  useEffect(() => {
    if (!isUnfinishedResult) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isUnfinishedResult]);
  const exportResult = useAnalysisResult(screen === 'dashboard' ? id : '');
  const openExport = (kind: ExportKind) => {
    setExportKind(kind);
    setExportOpen(true);
  };
  const markRecentResult = useCallback((analysisId: string) => {
    const next = { id: analysisId, status: 'result' as const };
    setRecentAnalysis(next);
    setRecentAnalysisState(getRecentAnalysis());
  }, []);
  const moveTo = (destination: Screen) => {
    if (destination === 'settings') {
      navigate('/settings', { state: { from: location.pathname } });
      return;
    }
    if (destination === 'loginManagement') {
      navigate('/settings/login-management', { state: { from: location.pathname } });
      return;
    }
    if (destination === 'history') {
      navigate('/history');
      return;
    }
    if (destination === 'analyzing' && recentAnalysis?.status === 'analyzing') {
      navigate(`/analyses/${recentAnalysis.id}`);
      return;
    }
    if (destination === 'dashboard' && recentAnalysis?.status === 'result') {
      navigate(`/analyses/${recentAnalysis.id}/result`);
      return;
    }
    navigate(destination === 'upload' ? '/upload' : '/');
  };
  return (
    <>
      <Header
        user={user}
        screen={screen}
        hasActiveAnalysis={recentAnalysis?.status === 'analyzing'}
        hasRecentResult={recentAnalysis?.status === 'result'}
        onNavigate={(s) => {
          if (isUnfinishedResult && s !== 'dashboard') setPendingNavigation(s);
          else moveTo(s);
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
      <Outlet context={{ openExport, markRecentResult }} />
      {exportOpen && exportResult.data && (
        <ExportDialog
          result={exportResult.data}
          initialKind={exportKind}
          onClose={() => setExportOpen(false)}
        />
      )}
      {pendingNavigation && (
        <Modal
          label="분석 결과 화면 나가기"
          className="leave-result-modal"
          onClose={() => setPendingNavigation(null)}
        >
          <div className="modal-head">
            <div>
              <h2>분석을 아직 완료하지 않았습니다</h2>
              <p>수정 끝내기 전에는 분석 기록에 저장되지 않습니다.</p>
            </div>
          </div>
          <div className="leave-result-note">
            현재 분석 결과는 임시로 보관됩니다. 계정 메뉴의 분석 결과보기를 통해 돌아와 작업을
            계속할 수 있습니다.
          </div>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setPendingNavigation(null)}>
              분석 결과로 돌아가기
            </Button>
            <Button
              variant="tertiary"
              onClick={() => {
                const destination = pendingNavigation;
                setPendingNavigation(null);
                moveTo(destination);
              }}
            >
              완료하지 않고 나가기
            </Button>
          </div>
        </Modal>
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
            onSuccess: ({ analysisId }) => {
              setRecentAnalysis({ id: analysisId, status: 'analyzing' });
              navigate(`/analyses/${analysisId}`);
            },
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
function LoginManagementRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const destination = from && !from.startsWith('/settings') ? from : '/upload';
  return <LoginManagementPage onBack={() => navigate(destination, { replace: true })} />;
}
function HistoryRoute() {
  const navigate = useNavigate();
  const records = getAnalysisRecords();
  return (
    <AnalysisHistoryPage
      records={records}
      onOpen={(analysis) => navigate(`/analyses/${analysis.id}/result`)}
    />
  );
}
function ResultRoute() {
  const { id = '' } = useParams();
  const { openExport, markRecentResult } = useOutletContext<{
    openExport: (kind: ExportKind) => void;
    markRecentResult: (analysisId: string) => void;
  }>();
  const query = useAnalysisResult(id);
  useEffect(() => {
    markRecentResult(id);
  }, [id, markRecentResult]);
  if (query.isLoading) return <PageLoading label="분석 결과를 불러오고 있습니다" />;
  if (query.isError || !query.data) return <PageError onRetry={() => query.refetch()} />;
  return (
    <ResultPage
      key={id}
      result={query.data}
      analysisId={id}
      onExport={() => openExport('document')}
      onFinish={() =>
        completeAnalysis({
          id,
          title: query.data.title,
          filename: query.data.filename,
          completedAt: new Date().toISOString(),
        })
      }
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
        <Route path="/settings/login-management" element={<LoginManagementRoute />} />
        <Route path="/history" element={<HistoryRoute />} />
        <Route path="/analyses/:id" element={<AnalysisRoute />} />
        <Route path="/analyses/:id/failed" element={<FailureRoute />} />
        <Route path="/analyses/:id/result" element={<ResultRoute />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
