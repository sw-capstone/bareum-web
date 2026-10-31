import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z
    .string()
    .refine(
      (value) => value.startsWith('/') || z.url().safeParse(value).success,
      'API 주소는 절대 URL 또는 /로 시작하는 동일 출처 경로여야 합니다.',
    )
    .default('/api'),
  VITE_USE_MOCK_API: z.enum(['true', 'false']).default('true'),
  VITE_API_CAPABILITIES: z.string().default('email-availability,email-verification,terms'),
  VITE_GOOGLE_CLIENT_ID: z
    .string()
    .refine(
      (value) => !value || value.endsWith('.apps.googleusercontent.com'),
      'Google 웹 Client ID 형식이 올바르지 않습니다.',
    )
    .default(''),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  throw new Error(`환경 변수 설정이 올바르지 않습니다: ${parsed.error.message}`);
}

const apiCapabilities = new Set(
  parsed.data.VITE_API_CAPABILITIES.split(',')
    .map((capability) => capability.trim())
    .filter(Boolean),
);

export type ApiCapability = 'email-availability' | 'email-verification' | 'terms';

export const env = {
  apiBaseUrl: parsed.data.VITE_API_BASE_URL,
  useMockApi: parsed.data.VITE_USE_MOCK_API === 'true',
  googleClientId: parsed.data.VITE_GOOGLE_CLIENT_ID,
  googleIdentityConfigured: Boolean(parsed.data.VITE_GOOGLE_CLIENT_ID),
  hasApiCapability: (capability: ApiCapability) =>
    import.meta.env.MODE !== 'test' && apiCapabilities.has(capability),
} as const;
