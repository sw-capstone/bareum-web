import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { SignupFlowContext, type SignupDraft, type SignupFlowValue } from './signupFlow';

export function SignupFlowProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<SignupDraft | null>(null);
  const clearDraft = useCallback(() => setDraft(null), []);
  const value = useMemo<SignupFlowValue>(
    () => ({
      draft,
      setDraft,
      clearDraft,
    }),
    [clearDraft, draft],
  );

  return <SignupFlowContext.Provider value={value}>{children}</SignupFlowContext.Provider>;
}
