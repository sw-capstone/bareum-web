import { env } from '../config/env';

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

export async function request<T>(
  path: string,
  init: RequestInit = {},
  signal?: AbortSignal,
): Promise<T> {
  const hasJsonBody = init.body != null && !(init.body instanceof FormData);
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...init,
    signal,
    headers: {
      Accept: 'application/json',
      ...(hasJsonBody && { 'Content-Type': 'application/json' }),
      ...init.headers,
    },
  });

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
