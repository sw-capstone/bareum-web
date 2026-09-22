import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { isValidPassword, PASSWORD_POLICY_MESSAGE } from './authValidation';

type PasswordFieldsProps = {
  password: string;
  confirmation: string;
  onPasswordChange: (value: string) => void;
  onConfirmationChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
};

export function PasswordFields({
  password,
  confirmation,
  onPasswordChange,
  onConfirmationChange,
  disabled = false,
  label = '비밀번호',
}: PasswordFieldsProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const mismatch = confirmation.length > 0 && password !== confirmation;
  const showPasswordPolicy = password.length > 0 && !isValidPassword(password);

  return (
    <div className="password-fields">
      <label className="field password-field">
        <span>{label}</span>
        <span className="password-input">
          <input
            aria-label={label}
            autoComplete="off"
            disabled={disabled}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => {
              const nextPassword = event.target.value;
              onPasswordChange(nextPassword);
              if (!nextPassword) setShowPassword(false);
            }}
            placeholder="12자 이상, 영문·숫자·특수문자 포함"
          />
          {password && (
            <button
              type="button"
              aria-label={showPassword ? `${label} 숨기기` : `${label} 보기`}
              disabled={disabled}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? <Eye /> : <EyeOff />}
            </button>
          )}
        </span>
        {showPasswordPolicy && <small role="alert">{PASSWORD_POLICY_MESSAGE}</small>}
      </label>
      <label className="field password-field">
        <span>{label} 확인</span>
        <span className="password-input">
          <input
            aria-invalid={mismatch}
            aria-label={`${label} 확인`}
            autoComplete="off"
            disabled={disabled}
            type={showConfirmation ? 'text' : 'password'}
            value={confirmation}
            onChange={(event) => {
              const nextConfirmation = event.target.value;
              onConfirmationChange(nextConfirmation);
              if (!nextConfirmation) setShowConfirmation(false);
            }}
          />
          {confirmation && (
            <button
              type="button"
              aria-label={showConfirmation ? `${label} 확인 숨기기` : `${label} 확인 보기`}
              disabled={disabled}
              onClick={() => setShowConfirmation((visible) => !visible)}
            >
              {showConfirmation ? <Eye /> : <EyeOff />}
            </button>
          )}
        </span>
        {mismatch && <small role="alert">비밀번호가 일치하지 않습니다.</small>}
      </label>
    </div>
  );
}
