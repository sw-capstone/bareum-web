import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';
import { AuthShell } from './AuthShell';
import { authApi } from '../../services/authApi';
import { ApiError } from '../../services/httpClient';
import { useSignupFlow } from './signupFlow';
import { termApi, type ServiceTerm, type TermCode } from '../../services/termApi';

type Agreement = true | false | null;

const termDefinitions: Array<{
  id: 'age' | 'service' | 'privacy' | 'marketing';
  code: TermCode;
  title: string;
  required: boolean;
  content: string;
}> = [
  {
    id: 'age',
    code: 'AGE_OVER_14',
    title: '만 14세 이상 가입',
    required: true,
    content: '회원은 만 14세 이상이어야 합니다. 본 약관 내용은 추후 확정된 원문으로 교체됩니다.',
  },
  {
    id: 'service',
    code: 'TERMS_OF_SERVICE',
    title: '서비스 이용약관',
    required: true,
    content:
      '서비스 이용 조건, 회원의 권리와 의무, 서비스 제공 및 제한에 관한 임시 약관 내용입니다.',
  },
  {
    id: 'privacy',
    code: 'PRIVACY_POLICY',
    title: '개인정보 처리방침',
    required: true,
    content: '회원가입과 서비스 제공에 필요한 개인정보의 수집·이용·보관에 관한 임시 안내입니다.',
  },
  {
    id: 'marketing',
    code: 'MARKETING_CONSENT',
    title: '마케팅 정보 수신',
    required: false,
    content:
      '새로운 기능과 서비스 관련 소식을 이메일로 받을 수 있습니다. 동의하지 않아도 서비스 이용에는 제한이 없습니다.',
  },
];

const missingRequiredTermsMessage = '필수 약관 정보를 모두 불러오지 못했습니다.';

export function TermsPage() {
  const navigate = useNavigate();
  const { draft } = useSignupFlow();
  const [agreements, setAgreements] = useState<Record<string, Agreement>>({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverTerms, setServerTerms] = useState<ServiceTerm[]>([]);
  const [termsLoading, setTermsLoading] = useState(termApi.isLive());
  const [termsError, setTermsError] = useState('');
  const terms = useMemo(
    () =>
      termDefinitions.map((definition) => {
        const serverTerm = serverTerms.find((term) => term.code === definition.code);
        return {
          ...definition,
          required: serverTerm?.required ?? definition.required,
          version: serverTerm?.version,
        };
      }),
    [serverTerms],
  );
  const requiredAccepted =
    terms.filter((term) => term.required).every((term) => agreements[term.id] === true) &&
    !termsLoading &&
    !termsError;

  useEffect(() => {
    if (!draft || !termApi.isLive()) return;
    const controller = new AbortController();
    let active = true;
    termApi
      .list(controller.signal)
      .then((items) => {
        const missing = termDefinitions
          .filter((definition) => definition.required)
          .filter((definition) => !items.some((item) => item.code === definition.code));
        if (missing.length) throw new Error(missingRequiredTermsMessage);
        if (!active) return;
        setServerTerms(items);
        setTermsError('');
      })
      .catch((cause) => {
        if (active && !(cause instanceof DOMException && cause.name === 'AbortError')) {
          setTermsError(
            cause instanceof Error && cause.message === missingRequiredTermsMessage
              ? cause.message
              : '약관 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
          );
        }
      })
      .finally(() => {
        if (active) setTermsLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [draft]);

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
          {termsLoading && <p role="status">약관 정보를 불러오고 있습니다.</p>}
          {termsError && (
            <p className="form-error" role="alert">
              {termsError}
            </p>
          )}
          {terms.map((term) => (
            <section className="term-item" key={term.id}>
              <h2>
                {term.title}{' '}
                <span>
                  ({term.required ? '필수' : '선택'}
                  {term.version ? ` · v${term.version}` : ''})
                </span>
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
