import { describe, expect, it } from 'vitest';
import { sampleResult } from '../mocks/analysis';
import { analysisProgressSchema, analysisResultSchema, loginResponseSchema } from './contracts';
describe('analysisResultSchema', () => {
  it('정상적인 백엔드 응답을 허용한다', () => {
    expect(analysisResultSchema.parse(sampleResult).id).toBe('analysis-demo');
  });
  it('잘못된 점수를 거부한다', () => {
    expect(() => analysisResultSchema.parse({ ...sampleResult, score: 120 })).toThrow();
  });
});

describe('analysisProgressSchema', () => {
  it('검사별 완료 및 실패 상태를 전달된 순서대로 허용한다', () => {
    const progress = analysisProgressSchema.parse({
      status: 'partial_failed',
      progress: 100,
      step: '분석 완료',
      checks: [
        { id: 'structure', label: '구조', status: 'completed' },
        {
          id: 'expression',
          label: '표현',
          status: 'failed',
          errorMessage: '표현 검사 시간이 초과되었습니다.',
        },
      ],
    });

    expect(progress.checks?.map((check) => check.status)).toEqual(['completed', 'failed']);
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
