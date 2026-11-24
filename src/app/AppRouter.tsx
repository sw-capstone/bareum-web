import { useEffect, useState } from 'react';
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { Header } from '../components/Header';
import { PageError, PageLoading } from '../components/AsyncState';
import { useSession } from '../contexts/session';
import {
  analysisKeys,
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
import { SettingsPage } from '../features/settings/SettingsPage';
import {
  AnalysisHistoryPage,
  LoginManagementPage,
  ReportAnalysisHistoryPage,
} from '../features/account/AccountPages';
import {
  getRecentAnalysis,
  getAnalysisRecords,
  completeAnalysis,
  deleteAnalysisRecord,
  deleteAnalysisReport,
  ensureAnalysisHistoryDemo,
  groupAnalysisRecords,
  RECENT_ANALYSIS_EVENT,
  setRecentAnalysis,
  type RecentAnalysis,
} from '../features/account/recentAnalysis';
import { authApi } from '../services/authApi';
import { ApiError } from '../services/httpClient';
import { useQueryClient } from '@tanstack/react-query';
import { clearAnalysisSession } from '../features/account/recentAnalysis';
import type { AnalysisProgress } from '../services/contracts';

function screenFor(pathname: string): Screen {
  if (pathname.startsWith('/history')) return 'history';
  if (pathname === '/settings/login-management') return 'loginManagement';
  if (pathname.startsWith('/settings')) return 'settings';
  if (pathname.startsWith('/analyses/') && pathname.endsWith('/result')) return 'dashboard';
  if (pathname.startsWith('/analyses/') && pathname.endsWith('/failed')) return 'failed';
  if (pathname.startsWith('/analyses/')) return 'analyzing';
  return 'upload';
}
function AppShell() {
  const { user, logout } = useSession();
  const queryClient = useQueryClient();
  useEffect(() => {
    const clear = () => queryClient.clear();
    window.addEventListener('bareum:session-expired', clear);
    return () => window.removeEventListener('bareum:session-expired', clear);
  }, [queryClient]);
  const navigate = useNavigate();
  const location = useLocation();
  const [recentAnalysis, setRecentAnalysisState] = useState<RecentAnalysis | null>(() =>
    getRecentAnalysis(),
  );
  const [logoutError, setLogoutError] = useState('');
  useEffect(() => {
    const update = () => setRecentAnalysisState(getRecentAnalysis());
    window.addEventListener(RECENT_ANALYSIS_EVENT, update);
    return () => window.removeEventListener(RECENT_ANALYSIS_EVENT, update);
  }, []);
  const screen = screenFor(location.pathname);
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
        onNavigate={moveTo}
        onLogout={async () => {
          try {
            await authApi.logout();
            queryClient.clear();
            clearAnalysisSession();
            logout();
            navigate('/login');
          } catch {
            setLogoutError('로그아웃하지 못했습니다. 잠시 후 다시 시도해 주세요.');
          }
        }}
      />
      {logoutError && (
        <p className="session-error" role="alert">
          {logoutError}
        </p>
      )}
      <Outlet />
    </>
  );
}
function RequireSession() {
  const { user, isLoading } = useSession();
  if (isLoading) return <PageLoading label="로그인 상태를 확인하고 있습니다" />;
  if (!user) return <Navigate to="/login" replace />;
  return <AppShell />;
}
function LoginRoute() {
  const { login, user, isLoading } = useSession();
  const { clearDraft, setDraft } = useSignupFlow();
  const navigate = useNavigate();
  useEffect(() => clearDraft(), [clearDraft]);
  if (isLoading) return <PageLoading label="로그인 상태를 확인하고 있습니다" />;
  if (user) return <Navigate to="/upload" replace />;
  return (
    <LoginPage
      onForgotPassword={() => navigate('/forgot-password')}
      onLogin={async (credentials) => {
        const user = await authApi.login(credentials);
        clearAnalysisSession();
        login(user);
        navigate('/upload');
      }}
      onGoogleLogin={async (idToken) => {
        const result = await authApi.googleLogin(idToken);
        if (result.status === 'SIGNUP_REQUIRED') {
          setDraft({
            kind: 'google',
            signupToken: result.signupToken,
            expiresAt: result.expiresAt,
          });
          navigate('/terms');
          return;
        }
        clearAnalysisSession();
        login(result.user);
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
    if (!isCancelDialogOpen && progress.data?.status === 'completed') {
      completeAnalysis({
        id,
        title: progress.data.title ?? progress.data.filename ?? '분석 보고서',
        filename: progress.data.filename ?? '분석 보고서',
        completedAt: new Date().toISOString(),
      });
      navigate(`/analyses/${id}/result`, { replace: true });
    }
    if (
      !isCancelDialogOpen &&
      (progress.data?.status === 'partial_failed' || progress.data?.status === 'failed')
    )
      navigate(`/analyses/${id}/failed`, { replace: true });
    if (progress.data?.status === 'canceled') navigate('/upload', { replace: true });
  }, [
    id,
    isCancelDialogOpen,
    navigate,
    progress.data?.status,
    progress.data?.title,
    progress.data?.filename,
  ]);
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
  const [records, setRecords] = useState(() => {
    ensureAnalysisHistoryDemo();
    return getAnalysisRecords();
  });
  const folders = groupAnalysisRecords(records);
  return (
    <AnalysisHistoryPage
      folders={folders}
      onOpen={(folder) => navigate(`/history/${folder.id}`)}
      onDelete={(folder) => {
        deleteAnalysisReport(folder.id);
        setRecords(getAnalysisRecords());
      }}
    />
  );
}
function ReportHistoryRoute() {
  const navigate = useNavigate();
  const { reportId = '' } = useParams();
  const [records, setRecords] = useState(() => getAnalysisRecords());
  const folder = groupAnalysisRecords(records).find((item) => item.id === reportId);
  if (!folder) return <Navigate to="/history" replace />;
  return (
    <ReportAnalysisHistoryPage
      folder={folder}
      onBack={() => navigate('/history')}
      onDelete={(record) => {
        deleteAnalysisRecord(record.id);
        setRecords(getAnalysisRecords());
      }}
    />
  );
}
function ResultRoute() {
  const { id = '' } = useParams();
  const queryClient = useQueryClient();
  const query = useAnalysisResult(id);
  const progress = queryClient.getQueryData<AnalysisProgress>(analysisKeys.progress(id));
  const reportGenerationFailed =
    progress?.checks?.some(
      (check) => check.id === 'report-generation' && check.status === 'failed',
    ) ?? false;
  if (query.isLoading) return <PageLoading label="분석 결과를 불러오고 있습니다" />;
  if (query.isError || !query.data) return <PageError onRetry={() => query.refetch()} />;
  return (
    <ResultPage key={id} result={query.data} reportGenerationFailed={reportGenerationFailed} />
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
        <Route path="/history/:reportId" element={<ReportHistoryRoute />} />
        <Route path="/analyses/:id" element={<AnalysisRoute />} />
        <Route path="/analyses/:id/failed" element={<FailureRoute />} />
        <Route path="/analyses/:id/result" element={<ResultRoute />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
