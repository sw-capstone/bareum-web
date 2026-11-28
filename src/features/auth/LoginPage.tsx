import { useRef, useState } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { Brand, Button, Checkbox, Field } from '../../components/ui';
import { env } from '../../config/env';
import { ApiError } from '../../services/httpClient';
import { GoogleLoginButton } from './GoogleLoginButton';

function emailLoginErrorMessage(cause: unknown) {
  if (
    cause instanceof ApiError &&
    (cause.code === 'AUTH-0014' || (cause.status === 401 && !cause.code))
  ) {
    return '이메일 또는 비밀번호가 올바르지 않습니다';
  }
  if (cause instanceof ApiError && (cause.status === 403 || cause.status === 429)) {
    return cause.message;
  }
  return '로그인에 실패했습니다. 다시 시도해주세요.';
}

type LoginPageProps = {
  onLogin: (credentials: {
    email: string;
    password: string;
    keepSignedIn: boolean;
  }) => Promise<void>;
  onSignup?: () => void;
  onGoogleLogin?: (idToken: string) => Promise<void>;
};

export function LoginPage({ onLogin, onSignup, onGoogleLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const liveAuth = env.hasApiCapability('auth-session');
  const googleReady =
    liveAuth && env.hasApiCapability('google-auth') && env.googleIdentityConfigured;
  const [keep, setKeep] = useState(!liveAuth);
  const [error, setError] = useState('');
  const [googleError, setGoogleError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const googleSubmitting = useRef(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !pw) {
      setError('이메일과 비밀번호를 모두 입력해 주세요.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onLogin({ email, password: pw, keepSignedIn: keep });
    } catch (cause) {
      setError(emailLoginErrorMessage(cause));
    } finally {
      setIsSubmitting(false);
    }
  }
  async function handleGoogleCredential(idToken: string) {
    if (!onGoogleLogin || isSubmitting || googleSubmitting.current) return;
    googleSubmitting.current = true;
    setGoogleError('');
    setIsSubmitting(true);
    try {
      await onGoogleLogin(idToken);
    } catch (cause) {
      setGoogleError(cause instanceof Error ? cause.message : 'Google 로그인에 실패했습니다.');
    } finally {
      googleSubmitting.current = false;
      setIsSubmitting(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-brand">
        <Brand inverse />
        <div>
          <h1>
            공공보고서를,
            <br />
            바르게.
          </h1>
          <p>
            형식·목차·수치·규정 준수를 근거와 함께 검토합니다. 검토 결과는 참고용이며 법적 효력은
            없습니다.
          </p>
        </div>
        <div className="login-meta">
          <span>HWPX · DOCX · PDF</span>
          <span>최대 20MB</span>
        </div>
      </section>
      <section className="login-form">
        <form onSubmit={submit}>
          <h2>로그인</h2>
          <p className="form-intro">업무 계정으로 로그인해 문서 검토를 시작하세요.</p>
          <Field
            label="이메일"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            placeholder="name@gov.kr"
          />
          <label className="field password-field">
            <span>비밀번호</span>
            <span className="password-input">
              <input
                aria-invalid={Boolean(error)}
                autoComplete="off"
                type={showPassword ? 'text' : 'password'}
                value={pw}
                onChange={(e) => {
                  const nextPassword = e.target.value;
                  setPw(nextPassword);
                  if (!nextPassword) setShowPassword(false);
                  setError('');
                }}
              />
              {pw && (
                <button
                  type="button"
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? <Eye /> : <EyeOff />}
                </button>
              )}
            </span>
            {error && <small role="alert">{error}</small>}
          </label>
          <div className="form-row">
            {!liveAuth && <Checkbox checked={keep} onChange={setKeep} label="로그인 상태 유지" />}
            <button
              type="button"
              className="text-link"
              disabled
              title="MVP에서 지원하지 않는 기능입니다"
            >
              비밀번호 찾기 (준비 중)
            </button>
          </div>
          <Button size="lg" type="submit" disabled={isSubmitting}>
            {isSubmitting ? '로그인 중' : '로그인'}
          </Button>
          <div className="or">
            <span />
            또는
            <span />
          </div>
          {googleReady && onGoogleLogin ? (
            <GoogleLoginButton onCredential={handleGoogleCredential} />
          ) : (
            <Button type="button" variant="secondary" size="lg" disabled>
              <LogIn />
              Google 로그인 준비 중
            </Button>
          )}
          {googleError && (
            <p className="form-error" role="alert">
              {googleError}
            </p>
          )}
          <p className="signup">
            아직 계정이 없으신가요?{' '}
            <button type="button" className="text-link" onClick={onSignup}>
              회원가입
            </button>
          </p>
        </form>
      </section>
    </main>
  );
}
