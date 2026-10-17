import { useMemo, useState, type ReactNode } from 'react';
import type { User } from '../types';
import { userSchema } from '../services/contracts';
import { SessionContext } from './session';
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = sessionStorage.getItem('bareum:user');
      if (!saved) return null;
      const parsed: unknown = JSON.parse(saved);
      const result = userSchema.safeParse(parsed);
      if (result.success) return result.data;
      sessionStorage.removeItem('bareum:user');
      return null;
    } catch {
      sessionStorage.removeItem('bareum:user');
      return null;
    }
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
