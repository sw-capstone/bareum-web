import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../config/env', () => ({
  env: {
    apiBaseUrl: 'https://api.example.com/api/v1',
    hasApiCapability: (capability: string) => capability === 'terms',
  },
}));

import { termApi } from './termApi';

describe('termApi', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('서버 약관 코드와 버전, 필수 여부를 검증한다', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify([
          { termId: 1, code: 'AGE_OVER_14', version: '1.0', required: true },
          { termId: 2, code: 'MARKETING_CONSENT', version: '1.0', required: false },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    await expect(termApi.list()).resolves.toHaveLength(2);
  });
});
