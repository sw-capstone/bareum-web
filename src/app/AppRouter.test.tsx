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

  it('비밀번호 찾기 주소로 직접 들어와도 로그인 화면으로 돌아간다', async () => {
    render(
      <SessionProvider>
        <SignupFlowProvider>
          <MemoryRouter initialEntries={['/forgot-password']}>
            <AppRouter />
          </MemoryRouter>
        </SignupFlowProvider>
      </SessionProvider>,
    );

    expect(await screen.findByRole('heading', { name: '로그인' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '비밀번호 찾기' })).not.toBeInTheDocument();
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
