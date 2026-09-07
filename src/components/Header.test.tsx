import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Header } from './Header';
describe('Header profile', () => {
  it('프로필을 누르면 설정과 로그아웃 메뉴를 표시한다', async () => {
    render(
      <Header
        user={{ name: '박바름', email: 'park@gov.kr' }}
        screen="upload"
        onNavigate={vi.fn()}
        onLogout={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /박바름/ }));
    expect(screen.getByRole('button', { name: '설정' })).toBeVisible();
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeVisible();
  });
});
