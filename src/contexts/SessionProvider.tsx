import { useMemo, useState, type ReactNode } from 'react';
import type { User } from '../types';
import { SessionContext } from './session';
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('bareum:user');
    return saved ? JSON.parse(saved) : null;
  });
  const value = useMemo(
    () => ({
      user,
      login: (next: User) => {
        sessionStorage.setItem('bareum:user', JSON.stringify(next));
        setUser(next);
      },
      logout: () => {
        sessionStorage.removeItem('bareum:user');
        setUser(null);
      },
    }),
    [user],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
