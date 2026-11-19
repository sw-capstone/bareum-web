import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../config/env', () => ({
  env: {
    apiBaseUrl: 'https://web.example/api',
    authApiBaseUrl: 'https://web.example/api/v1',
    useMockApi: true,
    hasApiCapability: (capability: string) =>
      ['auth-session', 'email-signup', 'google-auth'].includes(capability),
  },
}));

import { authApi } from './authApi';
import { clearAccessToken, request, setAccessToken } from './httpClient';

const authBase = 'https://web.example/api/v1/auth';
const tokens = {
  accessToken: 'new-access',
  tokenType: 'Bearer',
  expiresIn: 900,
  sessionExpiresIn: 28800,
};
const user = { memberId: 7, name: '김바름', email: 'name@gov.kr' };
const agreements = { age: true, service: true, privacy: true, marketing: false };
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('merged auth API integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearAccessToken();
  });

  it('이메일 가입 결과를 검증하고 가입 후 별도 로그인을 유지한다', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ memberId: 7 }, 201));
    await expect(
      authApi.signup({
        name: '김바름',
        email: 'name@gov.kr',
        password: 'Password123!',
        verificationToken: 'proof',
        agreements,
      }),
    ).resolves.toEqual({ memberId: 7 });
    expect(fetchMock).toHaveBeenCalledWith(
      `${authBase}/signup`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('이메일 로그인 후 Bearer로 현재 사용자를 조회하며 미지원 유지 옵션을 전송하지 않는다', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(json(tokens))
      .mockResolvedValueOnce(json(user));

    await expect(
      authApi.login({ email: user.email, password: 'Password123!', keepSignedIn: true }),
    ).resolves.toEqual({ name: user.name, email: user.email });
    const loginRequest = fetchMock.mock.calls[0]?.[1];
    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${authBase}/login/email`);
    expect(JSON.parse(String(loginRequest?.body))).toMatchObject({ keepSignedIn: false });
    expect(loginRequest?.credentials).toBe('include');
    expect(fetchMock.mock.calls[1]?.[0]).toBe(`${authBase}/me`);
    expect(new Headers(fetchMock.mock.calls[1]?.[1]?.headers).get('Authorization')).toBe(
      'Bearer new-access',
    );
  });

  it('새로고침 후 CSRF와 Refresh 쿠키로 세션을 복구한다', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(json({ headerName: 'X-CSRF-TOKEN', token: 'csrf' }))
      .mockResolvedValueOnce(json(tokens))
      .mockResolvedValueOnce(json(user));

    await expect(authApi.restoreSession()).resolves.toEqual({ name: user.name, email: user.email });
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      `${authBase}/csrf`,
      `${authBase}/token/renew`,
      `${authBase}/me`,
    ]);
    expect(fetchMock.mock.calls[0]?.[1]?.credentials).toBe('include');
    expect(fetchMock.mock.calls[1]?.[1]?.credentials).toBe('include');
    expect(new Headers(fetchMock.mock.calls[1]?.[1]?.headers).get('X-CSRF-TOKEN')).toBe('csrf');
    expect(new Headers(fetchMock.mock.calls[1]?.[1]?.headers).has('Authorization')).toBe(false);
  });

  it('동시 401 요청에서 Refresh를 한 번만 소비한다', async () => {
    setAccessToken('old-access');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.endsWith('/csrf')) return json({ headerName: 'X-CSRF-TOKEN', token: 'csrf' });
      if (url.endsWith('/token/renew')) return json(tokens);
      const bearer = new Headers(init?.headers).get('Authorization');
      return bearer === 'Bearer new-access' ? json({ ok: true }) : json({ code: 'EXPIRED' }, 401);
    });

    const responses = await Promise.all([
      request('/account/check', {}, undefined, { auth: 'required' }),
      request('/account/check', {}, undefined, { auth: 'required' }),
    ]);
    expect(responses).toEqual([{ ok: true }, { ok: true }]);
    expect(
      fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/token/renew')),
    ).toHaveLength(1);
  });

  it('로그아웃에 CSRF와 쿠키를 사용하고 Access Token을 보내지 않는다', async () => {
    setAccessToken('new-access');
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(json({ headerName: 'X-CSRF-TOKEN', token: 'csrf' }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    await authApi.logout();
    const logoutRequest = fetchMock.mock.calls[1]?.[1];
    expect(fetchMock.mock.calls[1]?.[0]).toBe(`${authBase}/logout`);
    expect(logoutRequest?.credentials).toBe('include');
    expect(new Headers(logoutRequest?.headers).get('X-CSRF-TOKEN')).toBe('csrf');
    expect(new Headers(logoutRequest?.headers).has('Authorization')).toBe(false);
  });

  it('Google 신규 회원은 가입 증명을 받아 약관 동의 후 자동 로그인한다', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(json({ headerName: 'X-CSRF-TOKEN', token: 'csrf' }))
      .mockResolvedValueOnce(
        json({ status: 'SIGNUP_REQUIRED', signupToken: 'gs_proof', signupExpiresIn: 600 }),
      )
      .mockResolvedValueOnce(json({ headerName: 'X-CSRF-TOKEN', token: 'csrf-2' }))
      .mockResolvedValueOnce(json(tokens, 201))
      .mockResolvedValueOnce(json(user));

    const result = await authApi.googleLogin('google-id-token');
    expect(result.status).toBe('SIGNUP_REQUIRED');
    expect(fetchMock.mock.calls[1]?.[0]).toBe(`${authBase}/login/google`);
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toEqual({
      idToken: 'google-id-token',
    });
    if (result.status !== 'SIGNUP_REQUIRED') throw new Error('신규 가입 응답이 아닙니다.');
    await expect(authApi.googleSignup(result.signupToken, agreements)).resolves.toEqual({
      name: user.name,
      email: user.email,
    });
    expect(fetchMock.mock.calls[3]?.[0]).toBe(`${authBase}/signup/google`);
    expect(JSON.parse(String(fetchMock.mock.calls[3]?.[1]?.body))).toEqual({
      signupToken: 'gs_proof',
      agreements,
    });
  });

  it('Google 기존 회원은 ID Token 검증 뒤 현재 사용자로 로그인한다', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(json({ headerName: 'X-CSRF-TOKEN', token: 'csrf' }))
      .mockResolvedValueOnce(json({ status: 'LOGIN', ...tokens }))
      .mockResolvedValueOnce(json(user));

    await expect(authApi.googleLogin('google-id-token')).resolves.toEqual({
      status: 'LOGIN',
      user: { name: user.name, email: user.email },
    });
    expect(fetchMock.mock.calls[2]?.[0]).toBe(`${authBase}/me`);
    expect(new Headers(fetchMock.mock.calls[2]?.[1]?.headers).get('Authorization')).toBe(
      'Bearer new-access',
    );
  });
});
