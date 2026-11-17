import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Logo } from '../ui/Logo';
import { Button, LinkButton } from '../ui/Button';
import { SegmentedControl } from '../ui/SegmentedControl';
import { NAV_ICONS } from '../ui/Icon';
import { NAV_GROUPS } from '../../lib/constants';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Sun, Moon, Monitor, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'Auto', icon: Monitor },
];

const MORE_ITEMS = NAV_GROUPS.flatMap((group) => group.items)
  .filter((item) => ['/budgets', '/goals', '/recurring', '/accounts', '/settings'].includes(item.to));

export function MoreSheet({ open, onClose }) {
  const { setting, setTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = async () => {
    setSigningOut(true);
    await logout();
    onClose();
    navigate('/login', { replace: true });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="More"
      description="Plan ahead and keep things tidy."
      size="sm"
      className="more-sheet"
    >
      <div className="more-grid">
        {MORE_ITEMS.map((item) => {
          const Icon = NAV_ICONS[item.icon];
          return (
            <LinkButton
              key={item.to}
              to={item.to}
              variant="soft"
              className="more-grid__item"
              icon={Icon}
              onClick={onClose}
            >
              {item.label}
            </LinkButton>
          );
        })}
      </div>

      <div className="more-sheet__appearance">
        <p className="more-sheet__label">Appearance</p>
        <SegmentedControl
          options={THEME_OPTIONS}
          value={setting}
          onChange={setTheme}
          label="Theme"
          fullWidth
        />
      </div>

      <div className="more-sheet__footer">
        <Logo size={26} compact />
        <span>Moneta v1.0</span>
        <Button
          variant="ghost"
          size="sm"
          icon={LogOut}
          onClick={handleLogout}
          loading={signingOut}
          className="more-sheet__signout"
        >
          Sign out
        </Button>
      </div>
    </Modal>
  );
}
