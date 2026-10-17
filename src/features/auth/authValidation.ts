export const PASSWORD_POLICY_MESSAGE =
  '12자리 이상, 영문 대/소문자, 숫자, 특수문자(!, @, #, $, %, &) 조합';

const passwordRules = [
  (value: string) => value.length >= 12,
  (value: string) => /[A-Za-z]/.test(value),
  (value: string) => /\d/.test(value),
  (value: string) => /[!@#$%&]/.test(value),
  (value: string) => !/\s/.test(value),
];

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password: string) {
  return passwordRules.every((rule) => rule(password));
}

export function formatRemainingTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
}
