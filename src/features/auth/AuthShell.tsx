import type { ReactNode } from 'react';
import { Brand } from '../../components/ui';

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <header className="auth-page__header">
        <Brand />
      </header>
      <section className="auth-page__content">{children}</section>
      <footer className="auth-page__footer">검토 결과는 참고용이며 법적 효력이 없습니다.</footer>
    </main>
  );
}
