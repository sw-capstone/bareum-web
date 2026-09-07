import { Check } from 'lucide-react';
export function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label className={`check ${disabled ? 'check--disabled' : ''}`}>
      <input
        type="checkbox"
        aria-label={label || '선택'}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="check__box">{checked && <Check size={14} />}</span>
      {label && <span>{label}</span>}
    </label>
  );
}
