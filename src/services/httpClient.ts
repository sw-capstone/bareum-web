import { env } from '../config/env';
import { csrfTokenSchema, loginTokenSchema } from './contracts';

let accessToken: string | null = null;
let renewal: Promise<string> | null = null;

export function setAccessToken(token: string) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = null;
}

function expireSession() {
  clearAccessToken();
  window.dispatchEvent(new Event('bareum:session-expired'));
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = { auth?: 'none' | 'optional' | 'required' };

export async function request<T>(
  path: string,
  init: RequestInit = {},
  signal?: AbortSignal,
  options: RequestOptions = {},
): Promise<T> {
  const auth = options.auth ?? 'optional';
  const send = async () => {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (init.body != null && !(init.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    const usedToken = auth === 'none' ? null : accessToken;
    if (usedToken) headers.set('Authorization', `Bearer ${usedToken}`);
    const baseUrl = path.startsWith('/auth')
      ? (env.authApiBaseUrl ?? env.apiBaseUrl)
      : env.apiBaseUrl;
    const response = await fetch(`${baseUrl}${path}`, { ...init, signal, headers });
    return { response, usedToken };
  };

  const first = await send();
  let response = first.response;
  if (response.status === 401 && auth === 'required') {
    if (!accessToken || accessToken === first.usedToken) await renewAccessToken();
    response = (await send()).response;
    if (response.status === 401) expireSession();
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(
      body?.detail ?? body?.message ?? body?.title ?? '서버 요청을 처리하지 못했습니다.',
      response.status,
      body?.code,
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function getCsrfToken() {
  const data = await request<unknown>(
    '/auth/csrf',
    { credentials: 'include', cache: 'no-store' },
    undefined,
    { auth: 'none' },
  );
  return csrfTokenSchema.parse(data).token;
}

export function renewAccessToken(): Promise<string> {
  if (!renewal) {
    renewal = (async () => {
      try {
        const csrf = await getCsrfToken();
        const data = await request<unknown>(
          '/auth/token/renew',
          { method: 'POST', credentials: 'include', headers: { 'X-CSRF-TOKEN': csrf } },
          undefined,
          { auth: 'none' },
        );
        const session = loginTokenSchema.parse(data);
        setAccessToken(session.accessToken);
        return session.accessToken;
      } catch (error) {
        expireSession();
        throw error;
      } finally {
        renewal = null;
      }
    })();
  }
  return renewal;
}
