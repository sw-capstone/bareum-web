import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { SignupFlowContext, type SignupFlowValue } from './signupFlow';
import { TermsPage } from './TermsPage';
import { SessionProvider } from '../../contexts/SessionProvider';

const signupFlow: SignupFlowValue = {
  draft: {
    kind: 'email',
    name: '김바름',
    email: 'new@example.com',
    password: 'Password123!',
    verificationToken: 'verified-token',
    verifiedAt: Date.now(),
  },
  setDraft: vi.fn(),
  clearDraft: vi.fn(),
};

describe('TermsPage local terms', () => {
  it('약관 조회 없이 필수 동의만으로 가입 버튼을 활성화한다', async () => {
    const user = userEvent.setup();
    render(
      <SessionProvider>
        <SignupFlowContext.Provider value={signupFlow}>
          <MemoryRouter>
            <TermsPage />
          </MemoryRouter>
        </SignupFlowContext.Provider>
      </SessionProvider>,
    );

    expect(
      screen.queryByText('필수 약관 정보를 모두 불러오지 못했습니다.'),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '가입하기' })).toBeDisabled();
    const agreeButtons = screen.getAllByLabelText('동의함');
    await user.click(agreeButtons[0]);
    await user.click(agreeButtons[1]);
    await user.click(agreeButtons[2]);

    expect(screen.getByRole('button', { name: '가입하기' })).toBeEnabled();
  });
});
