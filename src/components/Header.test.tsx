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

  it.each(['upload', 'analyzing'] as const)(
    '%s 화면에서는 페이지 경로를 표시하지 않는다',
    (currentScreen) => {
      const { container } = render(
        <Header
          user={{ name: '박바름', email: 'park@gov.kr' }}
          screen={currentScreen}
          onNavigate={vi.fn()}
          onLogout={vi.fn()}
        />,
      );

      expect(screen.queryByText('AI 공공보고서 검증')).not.toBeInTheDocument();
      expect(container.querySelector('.header-divider')).not.toBeInTheDocument();
    },
  );

  it('분석 결과 화면에서는 페이지 경로를 유지한다', () => {
    render(
      <Header
        user={{ name: '박바름', email: 'park@gov.kr' }}
        screen="dashboard"
        onNavigate={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    expect(screen.getByText('AI 공공보고서 검증')).toBeInTheDocument();
    expect(screen.getByText('분석 결과')).toBeInTheDocument();
  });
});
