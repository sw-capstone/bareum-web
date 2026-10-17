import { useRef, useState, type ReactNode } from 'react';
import {
  BarChart3,
  ChevronDown,
  FilePlus2,
  History,
  Home,
  LogIn,
  LogOut,
  RefreshCw,
  Settings,
} from 'lucide-react';
import type { Screen, User } from '../types';
import { Brand, Button } from './ui';
import { useOutsideClick } from '../hooks/useOutsideClick';
export function Header({
  user,
  onNavigate,
  onLogout,
  hasActiveAnalysis = false,
  hasRecentResult = false,
}: {
  user: User | null;
  screen: Screen;
  onNavigate: (s: Screen) => void;
  onLogout: () => void;
  hasActiveAnalysis?: boolean;
  hasRecentResult?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  useOutsideClick(profileRef, () => setMenuOpen(false));
  const navigateFromMenu = (destination: Screen) => {
    setMenuOpen(false);
    onNavigate(destination);
  };
  return (
    <header className="app-header">
      <button className="brand-button" onClick={() => onNavigate('upload')}>
        <Brand />
      </button>
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
              <div className="profile-menu" role="menu">
                <div className="profile-menu-user">
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                  <div className="profile-menu-shortcuts">
                    <MenuButton
                      icon={<Settings />}
                      label="계정 설정"
                      onClick={() => navigateFromMenu('settings')}
                    />
                  </div>
                </div>
                <div className="profile-menu-section">
                  <MenuButton
                    icon={<FilePlus2 />}
                    label="문서 업로드"
                    onClick={() => navigateFromMenu('upload')}
                  />
                  <MenuButton
                    icon={<RefreshCw />}
                    label="분석 중"
                    disabled={!hasActiveAnalysis}
                    onClick={() => navigateFromMenu('analyzing')}
                  />
                  <MenuButton
                    icon={<BarChart3 />}
                    label="분석 결과보기"
                    disabled={!hasRecentResult}
                    onClick={() => navigateFromMenu('dashboard')}
                  />
                  <MenuButton
                    icon={<History />}
                    label="내 분석 기록"
                    onClick={() => navigateFromMenu('history')}
                  />
                  <MenuButton
                    icon={<Home />}
                    label="홈페이지로 가기"
                    onClick={() => navigateFromMenu('upload')}
                  />
                </div>
                <div className="profile-menu-footer">
                  <MenuButton icon={<LogOut />} label="로그아웃" onClick={onLogout} />
                </div>
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

function MenuButton({
  icon,
  label,
  disabled,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" role="menuitem" disabled={disabled} onClick={onClick}>
      {icon}
      {label}
    </button>
  );
}
