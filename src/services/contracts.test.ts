import { describe, expect, it } from 'vitest';
import { sampleResult } from '../mocks/analysis';
import { analysisResultSchema, loginResponseSchema } from './contracts';
describe('analysisResultSchema', () => {
  it('정상적인 백엔드 응답을 허용한다', () => {
    expect(analysisResultSchema.parse(sampleResult).id).toBe('analysis-demo');
  });
  it('잘못된 점수를 거부한다', () => {
    expect(() => analysisResultSchema.parse({ ...sampleResult, score: 120 })).toThrow();
  });
});

describe('loginResponseSchema', () => {
  it('사용자 이름과 이메일을 검증한다', () => {
    expect(
      loginResponseSchema.parse({ user: { name: '박바름', email: 'name@gov.kr' } }).user.email,
    ).toBe('name@gov.kr');
    expect(() => loginResponseSchema.parse({ user: { name: '', email: 'invalid' } })).toThrow();
  });
});
