import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Header } from './Header';
describe('Header profile', () => {
  it('프로필을 누르면 사용자 정보와 계정 메뉴를 표시한다', async () => {
    render(
      <Header
        user={{ name: '박바름', email: 'park@gov.kr' }}
        screen="upload"
        onNavigate={vi.fn()}
        onLogout={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /박바름/ }));
    expect(screen.getByText('park@gov.kr')).toBeVisible();
    expect(screen.getByRole('menuitem', { name: '계정 설정' })).toBeVisible();
    expect(screen.getByRole('menuitem', { name: '구글 로그인 관리' })).toBeVisible();
    expect(screen.getByRole('menuitem', { name: '내 분석 기록' })).toBeVisible();
    expect(screen.getByRole('menuitem', { name: '로그아웃' })).toBeVisible();
  });

  it('최근 분석 상태에 맞춰 이동 메뉴를 활성화한다', async () => {
    const onNavigate = vi.fn();
    render(
      <Header
        user={{ name: '박바름', email: 'park@gov.kr' }}
        screen="upload"
        hasRecentResult
        onNavigate={onNavigate}
        onLogout={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /박바름/ }));
    expect(screen.getByRole('menuitem', { name: '분석 중' })).toBeDisabled();
    await userEvent.click(screen.getByRole('menuitem', { name: '분석 결과보기' }));

    expect(onNavigate).toHaveBeenCalledWith('dashboard');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
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

  it('분석 결과 화면에서도 페이지 경로를 표시하지 않는다', () => {
    render(
      <Header
        user={{ name: '박바름', email: 'park@gov.kr' }}
        screen="dashboard"
        onNavigate={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    expect(screen.queryByText('AI 공공보고서 검증')).not.toBeInTheDocument();
    expect(screen.queryByText('분석 결과')).not.toBeInTheDocument();
  });
});
