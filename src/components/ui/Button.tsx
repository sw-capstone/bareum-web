import type { ButtonHTMLAttributes } from 'react';
type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
};
export function Button({ variant = 'primary', size = 'md', children, ...props }: Props) {
  return (
    <button className={`button button--${variant} button--${size}`} {...props}>
      {children}
    </button>
  );
}
