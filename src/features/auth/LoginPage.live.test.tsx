import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../config/env', () => ({
  env: {
    googleIdentityConfigured: false,
    hasApiCapability: (capability: string) => capability === 'auth-session',
  },
}));

import { LoginPage } from './LoginPage';
import { ApiError } from '../../services/httpClient';

describe('live login screen', () => {
  it('서버가 지원하지 않는 로그인 상태 유지 옵션을 숨긴다', async () => {
    const onLogin = vi.fn().mockResolvedValue(undefined);
    render(<LoginPage onLogin={onLogin} />);

    expect(screen.queryByRole('checkbox', { name: '로그인 상태 유지' })).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('이메일'), 'name@gov.kr');
    await userEvent.type(screen.getByLabelText('비밀번호'), 'Password123!');
    await userEvent.click(screen.getByRole('button', { name: '로그인' }));
    expect(onLogin).toHaveBeenCalledWith({
      email: 'name@gov.kr',
      password: 'Password123!',
      keepSignedIn: false,
    });
  });

  it.each([
    [
      new ApiError('서버 요청을 처리하지 못했습니다.', 401, 'AUTH-0014'),
      '이메일 또는 비밀번호가 올바르지 않습니다',
    ],
    [
      new ApiError('서버 요청을 처리하지 못했습니다.', 401),
      '이메일 또는 비밀번호가 올바르지 않습니다',
    ],
    [
      new ApiError('서버 요청을 처리하지 못했습니다.', 503),
      '로그인에 실패했습니다. 다시 시도해주세요.',
    ],
    [new TypeError('Failed to fetch'), '로그인에 실패했습니다. 다시 시도해주세요.'],
  ])('로그인 오류를 사용자에게 알맞게 표시한다', async (failure, message) => {
    render(<LoginPage onLogin={vi.fn().mockRejectedValue(failure)} />);

    await userEvent.type(screen.getByLabelText('이메일'), 'name@gov.kr');
    await userEvent.type(screen.getByLabelText('비밀번호'), 'wrong-password');
    await userEvent.click(screen.getByRole('button', { name: '로그인' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
  });
});
