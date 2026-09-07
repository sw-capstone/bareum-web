import { createContext, useContext } from 'react';
import type { User } from '../types';
export interface SessionValue {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}
export const SessionContext = createContext<SessionValue | null>(null);
export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession은 SessionProvider 안에서 사용해야 합니다.');
  return value;
}
