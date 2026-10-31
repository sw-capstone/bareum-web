import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../config/env', () => ({
  env: {
    apiBaseUrl: 'https://api.example.com/api/v1',
    useMockApi: true,
    googleClientId: 'client.apps.googleusercontent.com',
    googleIdentityConfigured: true,
    hasApiCapability: (capability: string) =>
      ['email-availability', 'email-verification'].includes(capability),
  },
}));

import { authApi } from './authApi';

const requestId = '00000000-0000-4000-8000-000000000001';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('authApi live email foundation', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('이메일 사용 가능 여부를 서버 계약으로 조회한다', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ available: true }));

    await expect(authApi.checkEmailAvailability('new@example.com')).resolves.toEqual({
      available: true,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/api/v1/auth/email/availability?email=new%40example.com',
      expect.objectContaining({ cache: 'no-store' }),
    );
    const requestInit = fetchMock.mock.calls[0]?.[1];
    expect(new Headers(requestInit?.headers).has('Content-Type')).toBe(false);
  });

  it('메일 발송 접수 후 SENT 상태까지 조회한다', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ requestId, status: 'PENDING', expiresIn: 0 }, 202))
      .mockResolvedValueOnce(jsonResponse({ requestId, status: 'SENT', expiresIn: 300 }));

    await expect(authApi.sendVerification('new@example.com', 'signup')).resolves.toMatchObject({
      status: 'SENT',
      expiresIn: 300,
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.example.com/api/v1/auth/email-verification',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'new@example.com', purpose: 'SIGNUP' }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `https://api.example.com/api/v1/auth/email-verification/deliveries/${requestId}`,
      expect.objectContaining({ cache: 'no-store' }),
    );
  });

  it('재발송과 인증번호 확인에 서버 purpose 값을 사용한다', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ requestId, status: 'SENT', expiresIn: 300 }, 202))
      .mockResolvedValueOnce(jsonResponse({ verificationToken: 'verified-token', expiresIn: 600 }));

    await authApi.resendVerification('name@gov.kr', 'password-reset');
    await expect(
      authApi.verifyEmail('name@gov.kr', '123456', 'password-reset'),
    ).resolves.toMatchObject({ email: 'name@gov.kr', verificationToken: 'verified-token' });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.example.com/api/v1/auth/email-verification/resend',
      expect.objectContaining({
        body: JSON.stringify({ email: 'name@gov.kr', purpose: 'PASSWORD_RESET' }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.example.com/api/v1/auth/email-verification/code',
      expect.objectContaining({
        body: JSON.stringify({
          email: 'name@gov.kr',
          code: '123456',
          purpose: 'PASSWORD_RESET',
        }),
      }),
    );
  });

  it('아직 서버에 없는 비밀번호 변경 인증은 요청하지 않는다', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    await expect(authApi.sendVerification('name@gov.kr', 'password-change')).rejects.toMatchObject({
      code: 'FEATURE_NOT_AVAILABLE',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('발송 접수가 즉시 실패하면 상태를 추가 조회하지 않는다', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ requestId, status: 'FAILED', expiresIn: 0 }, 202));

    await expect(authApi.sendVerification('new@example.com', 'signup')).rejects.toMatchObject({
      code: 'EMAIL_DELIVERY_FAILED',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
