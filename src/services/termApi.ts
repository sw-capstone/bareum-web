import { env } from '../config/env';
import { termsSchema } from './contracts';
import { request } from './httpClient';

export type TermCode = 'AGE_OVER_14' | 'TERMS_OF_SERVICE' | 'PRIVACY_POLICY' | 'MARKETING_CONSENT';

export type ServiceTerm = {
  termId: number;
  code: TermCode;
  version: string;
  required: boolean;
};

export const termApi = {
  isLive: () => env.hasApiCapability('terms'),

  async list(signal?: AbortSignal): Promise<ServiceTerm[]> {
    if (!env.hasApiCapability('terms')) return [];
    const data = await request<unknown>('/terms', { cache: 'no-store' }, signal);
    return termsSchema.parse(data);
  },
};
