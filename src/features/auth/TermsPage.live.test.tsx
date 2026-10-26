import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { SignupFlowContext, type SignupFlowValue } from './signupFlow';
import { TermsPage } from './TermsPage';

vi.mock('../../services/termApi', () => ({
  termApi: {
    isLive: () => true,
    list: vi.fn().mockResolvedValue([
      { termId: 1, code: 'AGE_OVER_14', version: '1.0', required: true },
      { termId: 2, code: 'TERMS_OF_SERVICE', version: '1.0', required: true },
      { termId: 3, code: 'PRIVACY_POLICY', version: '1.0', required: true },
    ]),
  },
}));

const signupFlow: SignupFlowValue = {
  draft: {
    name: '김바름',
    email: 'new@example.com',
    password: 'Password123!',
    verificationToken: 'verified-token',
    verifiedAt: Date.now(),
  },
  setDraft: vi.fn(),
  clearDraft: vi.fn(),
};

describe('TermsPage live terms', () => {
  it('선택 약관이 없어도 필수 약관을 모두 받으면 가입을 막지 않는다', async () => {
    const user = userEvent.setup();
    render(
      <SignupFlowContext.Provider value={signupFlow}>
        <MemoryRouter>
          <TermsPage />
        </MemoryRouter>
      </SignupFlowContext.Provider>,
    );

    expect(await screen.findAllByText(/v1\.0/)).toHaveLength(3);
    const agreeButtons = screen.getAllByLabelText('동의함');
    await user.click(agreeButtons[0]);
    await user.click(agreeButtons[1]);
    await user.click(agreeButtons[2]);

    expect(screen.getByRole('button', { name: '가입하기' })).toBeEnabled();
  });
});
