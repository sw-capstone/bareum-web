import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';
import { AuthShell } from './AuthShell';
import { EmailVerification } from './EmailVerification';
import { PasswordFields } from './PasswordFields';
import { isValidPassword } from './authValidation';
import { authApi, type VerifiedEmail } from '../../services/authApi';
import { ApiError } from '../../services/httpClient';

export function PasswordResetPage() {
  const navigate = useNavigate();
  const [verifiedEmail, setVerifiedEmail] = useState<VerifiedEmail | null>(null);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canSubmit =
    Boolean(verifiedEmail) && isValidPassword(password) && password === confirmation;

  return (
    <AuthShell>
      <form
        className="auth-card auth-card--reset"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!canSubmit || !verifiedEmail) return;
          setError('');
          setIsSubmitting(true);
          try {
            await authApi.resetPassword({
              email: verifiedEmail.email,
              password,
              verificationToken: verifiedEmail.verificationToken,
            });
            navigate('/login', { replace: true });
          } catch (cause) {
            setError(
              cause instanceof ApiError
                ? cause.message
                : '비밀번호를 변경하지 못했습니다. 다시 시도해 주세요.',
            );
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        <button type="button" className="auth-back" onClick={() => navigate('/login')}>
          <ArrowLeft /> 로그인으로
        </button>
        <div className="auth-card__heading">
          <h1>비밀번호 찾기</h1>
          <p>가입한 이메일을 인증한 뒤 새 비밀번호를 설정해 주세요.</p>
        </div>
        <EmailVerification mode="reset" onVerified={setVerifiedEmail} />
        <PasswordFields
          label="새 비밀번호"
          password={password}
          confirmation={confirmation}
          onPasswordChange={setPassword}
          onConfirmationChange={setConfirmation}
          disabled={!verifiedEmail}
        />
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" disabled={!canSubmit || isSubmitting}>
          {isSubmitting ? '변경 중' : '완료'}
        </Button>
      </form>
    </AuthShell>
  );
}
