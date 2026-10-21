import { useState } from 'react';
import { ArrowLeft, CheckCircle2, KeyRound, Link2, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui';
import { useSession } from '../../contexts/session';
import { authApi, type VerifiedEmail } from '../../services/authApi';
import { ApiError } from '../../services/httpClient';
import { EmailVerification } from '../auth/EmailVerification';
import { PasswordFields } from '../auth/PasswordFields';
import { isValidPassword } from '../auth/authValidation';

export function SettingsPage({ onBack }: { onBack: () => void }) {
  const { user } = useSession();
  const [passwordChangeStarted, setPasswordChangeStarted] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState<VerifiedEmail | null>(null);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [googleConnected, setGoogleConnected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const canSave =
    Boolean(verifiedEmail) && isValidPassword(password) && password === confirmation && !saving;

  const savePassword = async () => {
    if (!user || !verifiedEmail || !canSave) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await authApi.changePassword({
        password,
        verificationToken: verifiedEmail.verificationToken,
      });
      setMessage('비밀번호가 안전하게 변경되었습니다.');
      setPasswordChangeStarted(false);
      setVerifiedEmail(null);
      setPassword('');
      setConfirmation('');
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : '비밀번호를 변경하지 못했습니다. 다시 시도해 주세요.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <main className="page settings-page">
      <button className="settings-back" onClick={onBack}>
        <ArrowLeft /> 이전 화면으로
      </button>
      <div className="page-heading settings-page-heading">
        <h1>계정 설정</h1>
      </div>

      <section className="settings-panel">
        <div className="settings-section-heading">
          <span>
            <ShieldCheck />
          </span>
          <div>
            <h2>기본 정보</h2>
          </div>
        </div>
        <div className="settings-field-grid">
          <label className="settings-field">
            <span>이름</span>
            <input value={user.name} disabled />
          </label>
          <label className="settings-field">
            <span>아이디</span>
            <input value={user.email} disabled />
          </label>
        </div>
      </section>

      <section className="settings-panel">
        <div className="settings-section-heading">
          <span>
            <Link2 />
          </span>
          <div>
            <h2>간편 로그인</h2>
            <p>Google 계정을 연결해 간편하게 로그인할 수 있습니다.</p>
          </div>
        </div>
        <div className="settings-action-row">
          <div className="settings-action-copy">
            <strong>Google 계정</strong>
            <small>
              {googleConnected ? 'Google 계정이 연결되었습니다.' : '연결된 계정이 없습니다.'}
            </small>
          </div>
          <Button
            variant={googleConnected ? 'secondary' : 'primary'}
            disabled={googleConnected}
            onClick={() => setGoogleConnected(true)}
          >
            {googleConnected ? <CheckCircle2 /> : <Link2 />}
            {googleConnected ? '연결 완료' : '계정 연결하기'}
          </Button>
        </div>
      </section>

      <section className="settings-panel">
        <div className="settings-section-heading">
          <span>
            <KeyRound />
          </span>
          <div>
            <h2>비밀번호 변경</h2>
          </div>
        </div>
        <div className="settings-password-current">
          <label className="settings-field settings-field--password">
            <span>비밀번호</span>
            <input type="password" value="password0000" disabled />
          </label>
          <Button
            variant="secondary"
            disabled={passwordChangeStarted}
            onClick={() => {
              setPasswordChangeStarted(true);
              setMessage('');
              setError('');
            }}
          >
            변경
          </Button>
        </div>

        <div className={`settings-verification ${passwordChangeStarted ? 'is-active' : ''}`}>
          <div className="settings-step-label">
            <Mail /> 가입 이메일 본인 인증
          </div>
          <EmailVerification
            key={passwordChangeStarted ? 'active' : 'inactive'}
            mode="change-password"
            initialEmail={user.email}
            emailLocked
            disabled={!passwordChangeStarted}
            legend="메일 인증"
            showMockHint={false}
            onVerified={(result) => {
              setVerifiedEmail(result);
              setMessage('본인 인증이 완료되었습니다. 새 비밀번호를 입력해 주세요.');
            }}
          />

          <div className={`settings-new-password ${verifiedEmail ? 'is-active' : ''}`}>
            <PasswordFields
              label="변경 비밀번호"
              password={password}
              confirmation={confirmation}
              onPasswordChange={setPassword}
              onConfirmationChange={setConfirmation}
              disabled={!verifiedEmail}
            />
          </div>
        </div>

        {error && (
          <p className="form-error settings-feedback" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="form-success settings-feedback" role="status">
            {message}
          </p>
        )}
        <div className="settings-actions">
          <Button variant="secondary" onClick={onBack}>
            이전으로
          </Button>
          <Button disabled={!canSave} onClick={savePassword}>
            {saving ? '저장 중' : '저장하기'}
          </Button>
        </div>
      </section>
    </main>
  );
}
