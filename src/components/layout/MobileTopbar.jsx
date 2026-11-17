import { Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { LogoMark } from '../ui/Logo';
import { Avatar } from '../ui/Avatar';
import { IconButton } from '../ui/Button';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export function MobileTopbar() {
  const { resolved, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <header className="mobile-topbar">
      <Link to="/dashboard" className="mobile-topbar__brand" aria-label="Moneta dashboard">
        <LogoMark size={28} />
        <span>moneta<span className="brand__dot">.</span></span>
      </Link>

      <div className="mobile-topbar__actions">
        <IconButton
          label={resolved === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          icon={resolved === 'dark' ? Sun : Moon}
          size="sm"
          onClick={toggleTheme}
        />
        <Link to="/settings" className="mobile-topbar__avatar" aria-label="Your profile and settings">
          <Avatar name={user?.name} size="sm" />
        </Link>
      </div>
    </header>
  );
}
