import { describe, expect, it } from 'vitest';
import { sampleResult } from '../mocks/analysis';
import { analysisResultSchema } from './contracts';
describe('analysisResultSchema', () => {
  it('정상적인 백엔드 응답을 허용한다', () => {
    expect(analysisResultSchema.parse(sampleResult).id).toBe('analysis-demo');
  });
  it('잘못된 점수를 거부한다', () => {
    expect(() => analysisResultSchema.parse({ ...sampleResult, score: 120 })).toThrow();
  });
});
