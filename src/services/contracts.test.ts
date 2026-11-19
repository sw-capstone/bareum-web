import { describe, expect, it } from 'vitest';
import { sampleResult } from '../mocks/analysis';
import {
  analysisProgressSchema,
  analysisResultSchema,
  currentUserSchema,
  googleLoginResponseSchema,
  loginTokenSchema,
} from './contracts';
describe('analysisResultSchema', () => {
  it('정상적인 백엔드 응답을 허용한다', () => {
    expect(analysisResultSchema.parse(sampleResult).id).toBe('analysis-demo');
  });
  it('잘못된 점수를 거부한다', () => {
    expect(() => analysisResultSchema.parse({ ...sampleResult, score: 120 })).toThrow();
  });
  it('서버 응답의 분해된 한글 문서명을 조합형으로 정규화한다', () => {
    const title = '경영지원팀 보고서';
    const result = analysisResultSchema.parse({
      ...sampleResult,
      title: title.normalize('NFD'),
      filename: `${title}.pdf`.normalize('NFD'),
    });

    expect(result.title).toBe(title);
    expect(result.filename).toBe(`${title}.pdf`);
  });
});

describe('analysisProgressSchema', () => {
  it('분석 중 화면의 한글 문서명도 정규화한다', () => {
    const title = '경영지원팀 보고서';
    const progress = analysisProgressSchema.parse({
      status: 'processing',
      progress: 48,
      step: '표현',
      title: title.normalize('NFD'),
      filename: `${title}.pdf`.normalize('NFD'),
    });

    expect(progress.title).toBe(title);
    expect(progress.filename).toBe(`${title}.pdf`);
  });
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

describe('auth response schemas', () => {
  it('현재 사용자와 로그인 토큰을 서버 형식으로 검증한다', () => {
    expect(
      currentUserSchema.parse({ memberId: 1, name: '박바름', email: 'name@gov.kr' }).email,
    ).toBe('name@gov.kr');
    expect(
      loginTokenSchema.parse({
        accessToken: 'token',
        tokenType: 'Bearer',
        expiresIn: 900,
        sessionExpiresIn: 28800,
      }).accessToken,
    ).toBe('token');
    expect(() => currentUserSchema.parse({ memberId: 0, name: '', email: 'invalid' })).toThrow();
  });
  it('Google 기존 회원과 신규 가입 응답을 구분한다', () => {
    expect(
      googleLoginResponseSchema.parse({
        status: 'SIGNUP_REQUIRED',
        signupToken: 'gs_token',
        signupExpiresIn: 600,
      }).status,
    ).toBe('SIGNUP_REQUIRED');
    expect(
      googleLoginResponseSchema.parse({
        status: 'LOGIN',
        accessToken: 'token',
        tokenType: 'Bearer',
        expiresIn: 900,
        sessionExpiresIn: 28800,
      }).status,
    ).toBe('LOGIN');
  });
});
