import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LoginPage } from './LoginPage';

describe('LoginPage password field', () => {
  it('비밀번호 표시와 숨김을 전환한다', async () => {
    render(<LoginPage onLogin={vi.fn().mockResolvedValue(undefined)} />);
    const password = screen.getByLabelText('비밀번호');

    expect(password).toHaveAttribute('type', 'password');
    expect(password).toHaveAttribute('autocomplete', 'off');
    expect(password).not.toHaveAttribute('placeholder');
    expect(screen.queryByRole('button', { name: '비밀번호 보기' })).not.toBeInTheDocument();

    await userEvent.type(password, 'secret');
    expect(screen.getByRole('button', { name: '비밀번호 보기' })).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: '비밀번호 보기' }));
    expect(password).toHaveAttribute('type', 'text');

    await userEvent.click(screen.getByRole('button', { name: '비밀번호 숨기기' }));
    expect(password).toHaveAttribute('type', 'password');

    await userEvent.clear(password);
    expect(screen.queryByRole('button', { name: '비밀번호 보기' })).not.toBeInTheDocument();
  });

  it('회원가입과 비밀번호 찾기 동작을 전달한다', async () => {
    const onSignup = vi.fn();
    const onForgotPassword = vi.fn();
    render(
      <LoginPage
        onLogin={vi.fn().mockResolvedValue(undefined)}
        onSignup={onSignup}
        onForgotPassword={onForgotPassword}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: '회원가입' }));
    await userEvent.click(screen.getByRole('button', { name: '비밀번호 찾기' }));

    expect(onSignup).toHaveBeenCalledOnce();
    expect(onForgotPassword).toHaveBeenCalledOnce();
  });

  it('입력한 자격 증명을 로그인 처리에 전달한다', async () => {
    const onLogin = vi.fn().mockResolvedValue(undefined);
    render(<LoginPage onLogin={onLogin} />);

    await userEvent.type(screen.getByLabelText('이메일'), 'name@gov.kr');
    await userEvent.type(screen.getByLabelText('비밀번호'), 'Password123!');
    await userEvent.click(screen.getByRole('button', { name: '로그인' }));

    expect(onLogin).toHaveBeenCalledWith({
      email: 'name@gov.kr',
      password: 'Password123!',
      keepSignedIn: true,
    });
  });
});
