import type { InputHTMLAttributes } from 'react';
export function Field({
  label,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input aria-invalid={Boolean(error)} {...props} />
      {error && <small role="alert">{error}</small>}
    </label>
  );
}
