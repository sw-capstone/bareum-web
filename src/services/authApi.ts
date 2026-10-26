import { env } from '../config/env';
import { isRegisteredEmail, MOCK_VERIFICATION_CODE, registerEmail } from '../mocks/auth';
import { ApiError, request } from './httpClient';
import type { User } from '../types';
import {
  emailAvailabilitySchema,
  loginResponseSchema,
  verificationDeliverySchema,
  verifyEmailResponseSchema,
} from './contracts';

export type VerificationPurpose = 'signup' | 'password-reset' | 'password-change';

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
    if (signal?.aborted) {
      reject(new DOMException('요청이 취소되었습니다.', 'AbortError'));
      return;
    }
    const onAbort = () => {
      window.clearTimeout(timer);
      reject(new DOMException('요청이 취소되었습니다.', 'AbortError'));
    };
    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });

type ServerVerificationPurpose = 'SIGNUP' | 'PASSWORD_RESET';

function throwIfDeliveryFailed(status: 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED') {
  if (status === 'FAILED' || status === 'CANCELLED') {
    throw new ApiError(
      '인증 메일을 발송하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      503,
      `EMAIL_DELIVERY_${status}`,
    );
  }
}

function serverPurpose(purpose: VerificationPurpose): ServerVerificationPurpose {
  if (purpose === 'password-change') {
    throw new ApiError(
      '비밀번호 변경 인증 API는 아직 서버에 준비되지 않았습니다.',
      503,
      'FEATURE_NOT_AVAILABLE',
    );
  }
  return purpose === 'signup' ? 'SIGNUP' : 'PASSWORD_RESET';
}

async function waitForVerificationDelivery(requestId: string, signal?: AbortSignal) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const data = await request<unknown>(
      `/auth/email-verification/deliveries/${encodeURIComponent(requestId)}`,
      { cache: 'no-store' },
      signal,
    );
    const delivery = verificationDeliverySchema.parse(data);
    if (delivery.status === 'SENT') return delivery;
    throwIfDeliveryFailed(delivery.status);
    await wait(500, signal);
  }
  throw new ApiError(
    '인증 메일 발송이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.',
    504,
    'EMAIL_DELIVERY_TIMEOUT',
  );
}

async function requestVerification(
  email: string,
  purpose: VerificationPurpose,
  resend: boolean,
  signal?: AbortSignal,
) {
  const data = await request<unknown>(
    `/auth/email-verification${resend ? '/resend' : ''}`,
    {
      method: 'POST',
      body: JSON.stringify({ email, purpose: serverPurpose(purpose) }),
    },
    signal,
  );
  const delivery = verificationDeliverySchema.parse(data);
  if (delivery.status === 'SENT') return delivery;
  throwIfDeliveryFailed(delivery.status);
  return waitForVerificationDelivery(delivery.requestId, signal);
}

async function mockSendVerification(
  email: string,
  purpose: VerificationPurpose,
  signal?: AbortSignal,
) {
  await wait(150, signal);
  if (purpose === 'signup' && isRegisteredEmail(email)) {
    throw new ApiError('이미 가입된 이메일입니다.', 409, 'EMAIL_ALREADY_REGISTERED');
  }
  if (purpose !== 'signup' && !isRegisteredEmail(email)) {
    throw new ApiError('가입되어 있지 않은 이메일입니다.', 404, 'EMAIL_NOT_REGISTERED');
  }
  return { expiresIn: 300, devCode: MOCK_VERIFICATION_CODE };
}

export const authApi = {
  async checkEmailAvailability(email: string, signal?: AbortSignal) {
    if (!env.hasApiCapability('email-availability')) {
      return { available: !isRegisteredEmail(email) };
    }
    const data = await request<unknown>(
      `/auth/email/availability?email=${encodeURIComponent(email)}`,
      { cache: 'no-store' },
      signal,
    );
    return emailAvailabilitySchema.parse(data);
  },

  async login(
    input: { email: string; password: string; keepSignedIn: boolean },
    signal?: AbortSignal,
  ): Promise<User> {
    if (env.useMockApi) {
      await wait(150, signal);
      registerEmail(input.email);
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
    if (!env.hasApiCapability('email-verification')) {
      return mockSendVerification(email, purpose, signal);
    }

    return requestVerification(email, purpose, false, signal);
  },

  async resendVerification(email: string, purpose: VerificationPurpose, signal?: AbortSignal) {
    if (!env.hasApiCapability('email-verification')) {
      return mockSendVerification(email, purpose, signal);
    }
    return requestVerification(email, purpose, true, signal);
  },

  async verifyEmail(
    email: string,
    code: string,
    purpose: VerificationPurpose,
    signal?: AbortSignal,
  ): Promise<VerifiedEmail> {
    if (!env.hasApiCapability('email-verification')) {
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
      '/auth/email-verification/code',
      {
        method: 'POST',
        body: JSON.stringify({ email, code, purpose: serverPurpose(purpose) }),
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

  async changePassword(
    input: { password: string; verificationToken: string },
    signal?: AbortSignal,
  ) {
    if (env.useMockApi) {
      await wait(150, signal);
      return;
    }
    await request<void>(
      '/account/password',
      {
        method: 'PATCH',
        body: JSON.stringify(input),
      },
      signal,
    );
  },
};
