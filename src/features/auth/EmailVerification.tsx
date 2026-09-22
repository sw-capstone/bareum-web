import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '../../components/ui';
import { ApiError } from '../../services/httpClient';
import { authApi, type VerifiedEmail, type VerificationPurpose } from '../../services/authApi';
import { formatRemainingTime, isValidEmail } from './authValidation';
import { useVerificationTimer } from './useVerificationTimer';

type EmailVerificationProps = {
  mode: 'signup' | 'reset';
  onVerified: (verifiedEmail: VerifiedEmail) => void;
};

const domainOptions = ['gov.kr', 'gmail.com', 'naver.com', 'daum.net', 'hanmail.net'];

export function EmailVerification({ mode, onVerified }: EmailVerificationProps) {
  const domainListId = useId();
  const [localPart, setLocalPart] = useState('');
  const [domain, setDomain] = useState('gov.kr');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const requestController = useRef<AbortController | null>(null);
  const timer = useVerificationTimer();
  const email = `${localPart.trim()}@${domain.trim()}`.toLowerCase();
  const purpose: VerificationPurpose = mode === 'signup' ? 'signup' : 'password-reset';

  useEffect(() => () => requestController.current?.abort(), []);

  const beginRequest = () => {
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    return controller.signal;
  };

  const messageFor = (cause: unknown) =>
    cause instanceof ApiError ? cause.message : '요청을 처리하지 못했습니다. 다시 시도해 주세요.';

  const resetVerification = () => {
    setVerified(false);
    setSent(false);
    setCode('');
    setMessage('');
    setError('');
    requestController.current?.abort();
    timer.stop();
  };

  const sendCode = async () => {
    setError('');
    setMessage('');
    if (!isValidEmail(email)) {
      setError('올바른 이메일 주소를 입력해 주세요.');
      return;
    }
    setIsSending(true);
    try {
      const result = await authApi.sendVerification(email, purpose, beginRequest());
      setSent(true);
      setVerified(false);
      setCode('');
      setMessage(
        'devCode' in result
          ? `인증번호를 발송했습니다. 개발용 인증번호는 ${result.devCode}입니다.`
          : '인증번호를 발송했습니다.',
      );
      timer.start(result.expiresIn);
    } catch (cause) {
      if (!(cause instanceof DOMException && cause.name === 'AbortError'))
        setError(messageFor(cause));
    } finally {
      setIsSending(false);
    }
  };

  const verifyCode = async () => {
    setError('');
    if (!sent || timer.remainingSeconds === 0) {
      setError('인증시간이 만료되었습니다. 인증번호를 다시 받아 주세요.');
      return;
    }
    setIsVerifying(true);
    try {
      const result = await authApi.verifyEmail(email, code, purpose, beginRequest());
      setVerified(true);
      setMessage('이메일 인증이 완료되었습니다.');
      timer.stop();
      onVerified(result);
    } catch (cause) {
      if (!(cause instanceof DOMException && cause.name === 'AbortError'))
        setError(messageFor(cause));
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <fieldset className="verification" disabled={verified}>
      <legend>이메일</legend>
      <div className="email-fields">
        <input
          aria-label="이메일 아이디"
          autoComplete="email"
          value={localPart}
          onChange={(event) => {
            setLocalPart(event.target.value.replace(/@.*$/, ''));
            resetVerification();
          }}
        />
        <span aria-hidden="true">@</span>
        <input
          aria-label="이메일 도메인"
          list={domainListId}
          value={domain}
          onChange={(event) => {
            setDomain(event.target.value);
            resetVerification();
          }}
        />
        <datalist id={domainListId}>
          {domainOptions.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
        <Button type="button" variant="secondary" onClick={sendCode} disabled={isSending}>
          {isSending ? '전송 중' : sent ? '재발송' : '메일 전송'}
        </Button>
      </div>
      {mode === 'reset' && !sent && !error && (
        <small className="mock-hint">Mock 테스트 계정: name@gov.kr</small>
      )}
      <div className="verification-code-row">
        <span className="verification-code-input">
          <input
            aria-label="인증번호"
            inputMode="numeric"
            maxLength={6}
            placeholder="인증번호 입력"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
            disabled={!sent || verified}
          />
          {sent && !verified && (
            <span className="verification-timer" aria-label="인증 제한 시간">
              {formatRemainingTime(timer.remainingSeconds)}
            </span>
          )}
        </span>
        <Button
          type="button"
          onClick={verifyCode}
          disabled={!sent || code.length !== 6 || verified || isVerifying}
        >
          {isVerifying ? '확인 중' : '인증확인'}
        </Button>
      </div>
      {error && (
        <small className="form-error" role="alert">
          {error}
        </small>
      )}
      {message && (
        <small className={verified ? 'form-success' : 'mock-hint'} role="status">
          {message}
        </small>
      )}
    </fieldset>
  );
}
