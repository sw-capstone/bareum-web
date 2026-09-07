import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url().default('http://localhost:8080/api'),
  VITE_USE_MOCK_API: z.enum(['true', 'false']).default('true'),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  throw new Error(`환경 변수 설정이 올바르지 않습니다: ${parsed.error.message}`);
}

export const env = {
  apiBaseUrl: parsed.data.VITE_API_BASE_URL,
  useMockApi: parsed.data.VITE_USE_MOCK_API === 'true',
} as const;
