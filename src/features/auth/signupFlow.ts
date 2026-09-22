import { createContext, useContext } from 'react';

export type SignupDraft = {
  name: string;
  email: string;
  password: string;
  verificationToken: string;
  verifiedAt: number;
};

export type SignupFlowValue = {
  draft: SignupDraft | null;
  setDraft: (draft: SignupDraft) => void;
  clearDraft: () => void;
};

export const SignupFlowContext = createContext<SignupFlowValue | null>(null);

export function useSignupFlow() {
  const value = useContext(SignupFlowContext);
  if (!value) throw new Error('useSignupFlow는 SignupFlowProvider 안에서 사용해야 합니다.');
  return value;
}
