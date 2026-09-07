import { useRef, useState } from 'react';
import { ChevronDown, LogIn, LogOut, Settings } from 'lucide-react';
import type { Screen, User } from '../types';
import { Brand, Button } from './ui';
import { useOutsideClick } from '../hooks/useOutsideClick';
export function Header({
  user,
  screen,
  onNavigate,
  onLogout,
}: {
  user: User | null;
  screen: Screen;
  onNavigate: (s: Screen) => void;
  onLogout: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  useOutsideClick(profileRef, () => setMenuOpen(false));
  const label = {
    upload: '새 문서',
    analyzing: '분석 중',
    failed: '분석 실패',
    dashboard: '분석 결과',
    report: '품질 리포트',
    login: '로그인',
    settings: '설정',
  }[screen];
  return (
    <header className="app-header">
      <button className="brand-button" onClick={() => onNavigate('upload')}>
        <Brand />
      </button>
      <span className="header-divider" />
      <div className="breadcrumb">
        AI 공공보고서 검증 <b>›</b> <strong>{label}</strong>
      </div>
      <div className="header-actions">
        {user ? (
          <div className="profile" ref={profileRef}>
            <button
              className={`user-chip ${menuOpen ? 'active' : ''}`}
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
            >
              <span>{user.name[0]}</span>
              <strong>{user.name}</strong>
              <ChevronDown />
            </button>
            {menuOpen && (
              <div className="profile-menu">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onNavigate('settings');
                  }}
                >
                  <Settings />
                  설정
                </button>
                <button onClick={onLogout}>
                  <LogOut />
                  로그아웃
                </button>
              </div>
            )}
          </div>
        ) : (
          <Button size="sm" variant="tertiary" onClick={() => onNavigate('login')}>
            <LogIn />
            로그인
          </Button>
        )}
      </div>
    </header>
  );
}
