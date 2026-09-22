import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';
import { AuthShell } from './AuthShell';
import { authApi } from '../../services/authApi';
import { ApiError } from '../../services/httpClient';
import { useSignupFlow } from './signupFlow';

type Agreement = true | false | null;

const terms = [
  {
    id: 'age',
    title: '만 14세 이상 가입',
    required: true,
    content: '회원은 만 14세 이상이어야 합니다. 본 약관 내용은 추후 확정된 원문으로 교체됩니다.',
  },
  {
    id: 'service',
    title: '서비스 이용약관',
    required: true,
    content:
      '서비스 이용 조건, 회원의 권리와 의무, 서비스 제공 및 제한에 관한 임시 약관 내용입니다.',
  },
  {
    id: 'privacy',
    title: '개인정보 처리방침',
    required: true,
    content: '회원가입과 서비스 제공에 필요한 개인정보의 수집·이용·보관에 관한 임시 안내입니다.',
  },
  {
    id: 'marketing',
    title: '마케팅 정보 수신',
    required: false,
    content:
      '새로운 기능과 서비스 관련 소식을 이메일로 받을 수 있습니다. 동의하지 않아도 서비스 이용에는 제한이 없습니다.',
  },
] as const;

export function TermsPage() {
  const navigate = useNavigate();
  const { draft } = useSignupFlow();
  const [agreements, setAgreements] = useState<Record<string, Agreement>>({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const requiredAccepted = terms
    .filter((term) => term.required)
    .every((term) => agreements[term.id] === true);

  if (!draft) return <Navigate to="/signup" replace />;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (Date.now() - draft.verifiedAt > 10 * 60 * 1000) {
      setError('이메일 인증 유효시간이 만료되었습니다. 다시 인증해 주세요.');
      return;
    }
    if (!requiredAccepted) return;
    setError('');
    setIsSubmitting(true);
    try {
      await authApi.signup({
        ...draft,
        agreements: {
          age: agreements.age === true,
          service: agreements.service === true,
          privacy: agreements.privacy === true,
          marketing: agreements.marketing === true,
        },
      });
      navigate('/login', { replace: true });
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : '회원가입을 완료하지 못했습니다. 다시 시도해 주세요.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <form className="auth-card auth-card--terms" onSubmit={submit}>
        <div className="auth-card__heading">
          <h1>약관 동의</h1>
        </div>
        <div className="terms-list">
          {terms.map((term) => (
            <section className="term-item" key={term.id}>
              <h2>
                {term.title} <span>({term.required ? '필수' : '선택'})</span>
              </h2>
              <div className="term-copy" tabIndex={0}>
                {term.content}
              </div>
              <fieldset className="term-choice">
                <legend className="sr-only">{term.title}</legend>
                <label>
                  <input
                    type="radio"
                    name={term.id}
                    checked={agreements[term.id] === true}
                    onChange={() => setAgreements((current) => ({ ...current, [term.id]: true }))}
                  />
                  동의함
                </label>
                <label>
                  <input
                    type="radio"
                    name={term.id}
                    checked={agreements[term.id] === false}
                    onChange={() => setAgreements((current) => ({ ...current, [term.id]: false }))}
                  />
                  동의 안 함
                </label>
              </fieldset>
            </section>
          ))}
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" disabled={!requiredAccepted || isSubmitting}>
          {isSubmitting ? '가입 중' : '가입하기'}
        </Button>
      </form>
    </AuthShell>
  );
}
