import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SignupPage } from './SignupPage';
import { TermsPage } from './TermsPage';
import { SignupFlowProvider } from './SignupFlowProvider';
import { SessionProvider } from '../../contexts/SessionProvider';

describe('인증 화면 흐름', () => {
  beforeEach(() => localStorage.clear());

  it('이메일 인증과 필수 약관 동의 후 회원가입을 완료한다', async () => {
    const user = userEvent.setup();
    render(
      <SessionProvider>
        <SignupFlowProvider>
          <MemoryRouter initialEntries={['/signup']}>
            <Routes>
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/login" element={<h1>로그인 완료 화면</h1>} />
            </Routes>
          </MemoryRouter>
        </SignupFlowProvider>
      </SessionProvider>,
    );

    await user.type(screen.getByLabelText('사용자 이름'), '김바름');
    expect(screen.getByLabelText('이메일 도메인')).toHaveValue('');
    await user.type(screen.getByLabelText('이메일 아이디'), 'new-user');
    await user.type(screen.getByLabelText('이메일 도메인'), 'example.com');
    await user.click(screen.getByRole('button', { name: '메일 전송' }));
    await screen.findByText(/개발용 인증번호는 123456/);
    await user.type(screen.getByLabelText('인증번호'), '123456');
    await user.click(screen.getByRole('button', { name: '인증확인' }));
    await screen.findByText('이메일 인증이 완료되었습니다.');
    await user.type(screen.getByLabelText('비밀번호'), 'Password123!');
    await user.type(screen.getByLabelText('비밀번호 확인'), 'Password123!');
    await user.click(screen.getByRole('button', { name: '다음' }));

    expect(screen.getByRole('heading', { name: '약관 동의' })).toBeInTheDocument();
    const agreeButtons = screen.getAllByLabelText('동의함');
    await user.click(agreeButtons[0]);
    await user.click(agreeButtons[1]);
    await user.click(agreeButtons[2]);
    await user.click(screen.getByRole('button', { name: '가입하기' }));

    expect(await screen.findByRole('heading', { name: '로그인 완료 화면' })).toBeInTheDocument();
  });
});
