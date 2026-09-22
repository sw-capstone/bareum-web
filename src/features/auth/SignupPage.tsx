import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Field } from '../../components/ui';
import { AuthShell } from './AuthShell';
import { EmailVerification } from './EmailVerification';
import { PasswordFields } from './PasswordFields';
import { isValidPassword } from './authValidation';
import { useSignupFlow } from './signupFlow';
import type { VerifiedEmail } from '../../services/authApi';

export function SignupPage() {
  const navigate = useNavigate();
  const { setDraft } = useSignupFlow();
  const [name, setName] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState<VerifiedEmail | null>(null);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const canContinue =
    name.trim().length > 0 &&
    Boolean(verifiedEmail) &&
    isValidPassword(password) &&
    password === confirmation;

  return (
    <AuthShell>
      <form
        className="auth-card auth-card--signup"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canContinue) return;
          if (!verifiedEmail) return;
          setDraft({
            name: name.trim(),
            email: verifiedEmail.email,
            password,
            verificationToken: verifiedEmail.verificationToken,
            verifiedAt: verifiedEmail.verifiedAt,
          });
          navigate('/terms');
        }}
      >
        <button type="button" className="auth-back" onClick={() => navigate('/login')}>
          <ArrowLeft /> 로그인으로
        </button>
        <div className="auth-card__heading">
          <h1>회원가입</h1>
        </div>
        <Field
          label="사용자 이름"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="프로필에 표시할 이름"
        />
        <EmailVerification mode="signup" onVerified={setVerifiedEmail} />
        <PasswordFields
          password={password}
          confirmation={confirmation}
          onPasswordChange={setPassword}
          onConfirmationChange={setConfirmation}
        />
        <Button type="submit" size="lg" disabled={!canContinue}>
          다음
        </Button>
      </form>
    </AuthShell>
  );
}
