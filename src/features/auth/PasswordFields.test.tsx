import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PasswordFields } from './PasswordFields';

function TestPasswordFields() {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  return (
    <PasswordFields
      label="새 비밀번호"
      password={password}
      confirmation={confirmation}
      onPasswordChange={setPassword}
      onConfirmationChange={setConfirmation}
    />
  );
}

describe('PasswordFields', () => {
  it('입력 중 모든 조건을 충족할 때까지 한 문장으로 안내한다', async () => {
    const user = userEvent.setup();
    render(<TestPasswordFields />);

    const password = screen.getByLabelText('새 비밀번호');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '새 비밀번호 보기' })).not.toBeInTheDocument();

    await user.type(password, 'Password');
    expect(
      screen.getByText('12자리 이상, 영문 대/소문자, 숫자, 특수문자(!, @, #, $, %, &) 조합'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '새 비밀번호 보기' })).toBeVisible();

    await user.type(password, '123');
    expect(
      screen.getByText('12자리 이상, 영문 대/소문자, 숫자, 특수문자(!, @, #, $, %, &) 조합'),
    ).toBeInTheDocument();

    await user.type(password, '!');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('확인 입력값이 있을 때만 보기 버튼과 불일치 안내를 표시한다', async () => {
    const user = userEvent.setup();
    render(<TestPasswordFields />);

    expect(screen.queryByRole('button', { name: '새 비밀번호 확인 보기' })).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('새 비밀번호 확인'), 'different');

    expect(screen.getByRole('button', { name: '새 비밀번호 확인 보기' })).toBeVisible();
    expect(screen.getByText('비밀번호가 일치하지 않습니다.')).toBeInTheDocument();
  });
});
