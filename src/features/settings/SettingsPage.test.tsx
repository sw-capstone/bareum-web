import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionContext } from '../../contexts/session';
import { SettingsPage } from './SettingsPage';

describe('SettingsPage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('가입 이메일 본인 인증 후에만 새 비밀번호 입력과 저장을 활성화한다', async () => {
    const user = userEvent.setup();
    render(
      <SessionContext.Provider
        value={{
          user: { name: '박바름', email: 'name@gov.kr' },
          login: vi.fn(),
          logout: vi.fn(),
        }}
      >
        <SettingsPage onBack={vi.fn()} />
      </SessionContext.Provider>,
    );

    expect(screen.getByDisplayValue('박바름')).toBeDisabled();
    expect(screen.getByDisplayValue('name@gov.kr')).toBeDisabled();
    expect(screen.getByLabelText('변경 비밀번호')).toBeDisabled();
    expect(screen.getByRole('button', { name: '메일 전송' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '저장하기' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: '변경' }));
    expect(screen.getByLabelText('이메일 아이디')).toBeDisabled();
    expect(screen.getByLabelText('이메일 도메인')).toBeDisabled();
    expect(screen.getByRole('button', { name: '메일 전송' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: '메일 전송' }));
    await screen.findByText(/개발용 인증번호는 123456/);
    await user.type(screen.getByLabelText('인증번호'), '123456');
    await user.click(screen.getByRole('button', { name: '인증확인' }));
    await screen.findByText('본인 인증이 완료되었습니다. 새 비밀번호를 입력해 주세요.');

    expect(screen.getByLabelText('변경 비밀번호')).toBeEnabled();
    await user.type(screen.getByLabelText('변경 비밀번호'), 'Password123!');
    await user.type(screen.getByLabelText('변경 비밀번호 확인'), 'Password123!');
    expect(screen.getByRole('button', { name: '저장하기' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: '저장하기' }));
    await waitFor(() =>
      expect(screen.getByText('비밀번호가 안전하게 변경되었습니다.')).toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: '메일 전송' })).toBeDisabled();
  });

  it('Google 간편 로그인 연결 상태를 표시한다', async () => {
    const user = userEvent.setup();
    render(
      <SessionContext.Provider
        value={{
          user: { name: '박바름', email: 'name@gov.kr' },
          login: vi.fn(),
          logout: vi.fn(),
        }}
      >
        <SettingsPage onBack={vi.fn()} />
      </SessionContext.Provider>,
    );

    await user.click(screen.getByRole('button', { name: /계정 연결하기/ }));
    expect(screen.getByRole('button', { name: /연결 완료/ })).toBeDisabled();
    expect(screen.getByText('Google 계정이 연결되었습니다.')).toBeInTheDocument();
  });
});
