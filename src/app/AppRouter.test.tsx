import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SessionProvider } from '../contexts/SessionProvider';
import { SignupFlowProvider } from '../features/auth/SignupFlowProvider';
import { AppRouter } from './AppRouter';

describe('로그인 화면 인증 페이지 이동', () => {
  beforeEach(() => sessionStorage.clear());

  it('회원가입을 누르면 회원가입 페이지로 이동한다', async () => {
    render(
      <SessionProvider>
        <SignupFlowProvider>
          <MemoryRouter initialEntries={['/login']}>
            <AppRouter />
          </MemoryRouter>
        </SignupFlowProvider>
      </SessionProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: '회원가입' }));

    expect(screen.getByRole('heading', { name: '회원가입' })).toBeInTheDocument();
  });

  it('비밀번호 찾기를 누르면 비밀번호 찾기 페이지로 이동한다', async () => {
    render(
      <SessionProvider>
        <SignupFlowProvider>
          <MemoryRouter initialEntries={['/login']}>
            <AppRouter />
          </MemoryRouter>
        </SignupFlowProvider>
      </SessionProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: '비밀번호 찾기' }));

    expect(screen.getByRole('heading', { name: '비밀번호 찾기' })).toBeInTheDocument();
  });

  it('로그인하지 않은 사용자의 보호 화면 접근을 차단한다', () => {
    render(
      <SessionProvider>
        <SignupFlowProvider>
          <MemoryRouter initialEntries={['/upload']}>
            <AppRouter />
          </MemoryRouter>
        </SignupFlowProvider>
      </SessionProvider>,
    );

    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument();
  });
});
