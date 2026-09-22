const REGISTERED_EMAILS_KEY = 'bareum:registered-emails';

export const MOCK_VERIFICATION_CODE = '123456';

export function getRegisteredEmails() {
  try {
    const saved = localStorage.getItem(REGISTERED_EMAILS_KEY);
    const parsed: unknown = saved ? JSON.parse(saved) : [];
    const registered = Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string')
      : [];
    return Array.from(new Set(['name@gov.kr', ...registered]));
  } catch {
    return ['name@gov.kr'];
  }
}

export function isRegisteredEmail(email: string) {
  return getRegisteredEmails().includes(email.toLowerCase());
}

export function registerEmail(email: string) {
  const next = Array.from(new Set([...getRegisteredEmails(), email.toLowerCase()]));
  localStorage.setItem(REGISTERED_EMAILS_KEY, JSON.stringify(next));
}
