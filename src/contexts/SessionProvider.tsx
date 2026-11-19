import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '../types';
import { userSchema } from '../services/contracts';
import { env } from '../config/env';
import { authApi } from '../services/authApi';
import { clearAnalysisSession } from '../features/account/recentAnalysis';
import { SessionContext } from './session';
export function SessionProvider({ children }: { children: ReactNode }) {
  const liveAuth = env.hasApiCapability('auth-session');
  const [user, setUser] = useState<User | null>(() => {
    if (liveAuth) return null;
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
  const [isLoading, setIsLoading] = useState(liveAuth);
  useEffect(() => {
    if (!liveAuth) return;
    let active = true;
    authApi
      .restoreSession()
      .then((restored) => {
        if (active) setUser(restored);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    const expire = () => {
      clearAnalysisSession();
      setUser(null);
    };
    window.addEventListener('bareum:session-expired', expire);
    return () => {
      active = false;
      window.removeEventListener('bareum:session-expired', expire);
    };
  }, [liveAuth]);
  const value = useMemo(
    () => ({
      user,
      isLoading,
      login: (next: User) => {
        if (!liveAuth) sessionStorage.setItem('bareum:user', JSON.stringify(next));
        setUser(next);
      },
      logout: () => {
        sessionStorage.removeItem('bareum:user');
        setUser(null);
      },
    }),
    [isLoading, liveAuth, user],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
