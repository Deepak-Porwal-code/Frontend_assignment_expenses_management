import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Moon, Plus, Sun } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { Avatar } from '../ui/Avatar';
import { Button, IconButton } from '../ui/Button';
import { NAV_ICONS } from '../ui/Icon';
import { NAV_GROUPS } from '../../lib/constants';
import { useUI } from '../../context/UIContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { cx } from '../../lib/cx';

export function Sidebar() {
  const { openTransactionModal } = useUI();
  const { resolved, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <NavLink to="/dashboard" aria-label="Moneta dashboard">
          <Logo size={34} />
        </NavLink>
      </div>

      <Button
        icon={Plus}
        fullWidth
        className="sidebar__add"
        onClick={() => openTransactionModal()}
      >
        Add transaction
      </Button>

      <nav className="sidebar__nav" aria-label="Primary">
        {NAV_GROUPS.map((group) => (
          <div className="sidebar__group" key={group.label}>
            <p className="sidebar__group-label">{group.label}</p>
            {group.items.map((item) => {
              const Icon = NAV_ICONS[item.icon];
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => cx('sidebar__link', isActive && 'is-active')}
                >
                  <Icon size={18} strokeWidth={2} aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__tools">
          <NavLink to="/settings" className="sidebar__user">
            <Avatar name={user?.name} size="sm" />
            <span className="sidebar__user-text">
              <span className="sidebar__user-name">{user?.name}</span>
              <span className="sidebar__user-email">{user?.email}</span>
            </span>
          </NavLink>
          <div className="sidebar__actions">
            <IconButton
              label={resolved === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              icon={resolved === 'dark' ? Sun : Moon}
              size="sm"
              onClick={toggleTheme}
            />
            <IconButton
              label="Sign out"
              icon={LogOut}
              size="sm"
              onClick={handleLogout}
            />
          </div>
        </div>
        <p className="sidebar__privacy">
          <span className="sidebar__privacy-dot" aria-hidden="true" />
          Private to your account
        </p>
      </div>
    </aside>
  );
}
