import { env } from '../config/env';
import { isRegisteredEmail, MOCK_VERIFICATION_CODE, registerEmail } from '../mocks/auth';
import { ApiError, request } from './httpClient';
import type { User } from '../types';
import {
  loginResponseSchema,
  sendVerificationResponseSchema,
  verifyEmailResponseSchema,
} from './contracts';

export type VerificationPurpose = 'signup' | 'password-reset';

export type VerifiedEmail = {
  email: string;
  verificationToken: string;
  verifiedAt: number;
};

export type SignupAgreement = 'age' | 'service' | 'privacy' | 'marketing';

export type SignupRequest = {
  name: string;
  email: string;
  password: string;
  verificationToken: string;
  agreements: Record<SignupAgreement, boolean>;
};

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer);
        reject(new DOMException('요청이 취소되었습니다.', 'AbortError'));
      },
      { once: true },
    );
  });

export const authApi = {
  async login(
    input: { email: string; password: string; keepSignedIn: boolean },
    signal?: AbortSignal,
  ): Promise<User> {
    if (env.useMockApi) {
      await wait(150, signal);
      return { name: '박바름', email: input.email };
    }
    const data = await request<unknown>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify(input) },
      signal,
    );
    return loginResponseSchema.parse(data).user;
  },

  async logout(signal?: AbortSignal) {
    if (env.useMockApi) {
      await wait(80, signal);
      return;
    }
    await request<void>('/auth/logout', { method: 'POST' }, signal);
  },

  async sendVerification(email: string, purpose: VerificationPurpose, signal?: AbortSignal) {
    if (env.useMockApi) {
      await wait(150, signal);
      if (purpose === 'signup' && isRegisteredEmail(email)) {
        throw new ApiError('이미 가입된 이메일입니다.', 409, 'EMAIL_ALREADY_REGISTERED');
      }
      if (purpose === 'password-reset' && !isRegisteredEmail(email)) {
        throw new ApiError('가입되어 있지 않은 이메일입니다.', 404, 'EMAIL_NOT_REGISTERED');
      }
      return { expiresIn: 300, devCode: MOCK_VERIFICATION_CODE };
    }

    const data = await request<unknown>(
      '/auth/email-verifications',
      {
        method: 'POST',
        body: JSON.stringify({ email, purpose }),
      },
      signal,
    );
    return sendVerificationResponseSchema.parse(data);
  },

  async verifyEmail(
    email: string,
    code: string,
    purpose: VerificationPurpose,
    signal?: AbortSignal,
  ): Promise<VerifiedEmail> {
    if (env.useMockApi) {
      await wait(100, signal);
      if (code !== MOCK_VERIFICATION_CODE) {
        throw new ApiError('인증번호가 올바르지 않습니다.', 400, 'INVALID_VERIFICATION_CODE');
      }
      return {
        email,
        verificationToken: `mock-${purpose}-${email}`,
        verifiedAt: Date.now(),
      };
    }

    const data = await request<unknown>(
      '/auth/email-verifications/confirm',
      {
        method: 'POST',
        body: JSON.stringify({ email, code, purpose }),
      },
      signal,
    );
    const parsed = verifyEmailResponseSchema.parse(data);
    return { email, verificationToken: parsed.verificationToken, verifiedAt: Date.now() };
  },

  async signup(input: SignupRequest, signal?: AbortSignal) {
    if (env.useMockApi) {
      await wait(150, signal);
      registerEmail(input.email);
      return;
    }
    await request<void>(
      '/auth/signup',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      signal,
    );
  },

  async resetPassword(
    input: { email: string; password: string; verificationToken: string },
    signal?: AbortSignal,
  ) {
    if (env.useMockApi) {
      await wait(150, signal);
      return;
    }
    await request<void>(
      '/auth/password-reset',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      signal,
    );
  },
};
