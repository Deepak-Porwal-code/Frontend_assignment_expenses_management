import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, ChartPie, Menu, Plus } from 'lucide-react';
import { MoreSheet } from './MoreSheet';
import { NAV_ICONS } from '../ui/Icon';
import { useUI } from '../../context/UIContext';
import { cx } from '../../lib/cx';

const TABS = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/transactions', label: 'Activity', icon: ArrowLeftRight },
  null,
  { to: '/analytics', label: 'Insights', icon: ChartPie },
];

const MORE_PATHS = ['/budgets', '/goals', '/recurring', '/accounts', '/settings'];

export function MobileTabBar() {
  const { openTransactionModal } = useUI();
  const [moreOpen, setMoreOpen] = useState(false);
  const { pathname } = useLocation();
  const moreActive = MORE_PATHS.includes(pathname);

  return (
    <>
      <nav className="tabbar" aria-label="Primary">
        {TABS.map((tab, index) => {
          if (!tab) {
            return (
              <div className="tabbar__slot tabbar__slot--fab" key="add">
                <button
                  type="button"
                  className="tabbar__fab"
                  onClick={() => openTransactionModal()}
                  aria-label="Add transaction"
                >
                  <Plus size={24} strokeWidth={2.6} />
                </button>
              </div>
            );
          }

          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) => cx('tabbar__item', isActive && 'is-active')}
            >
              <Icon size={21} strokeWidth={2} aria-hidden="true" />
              <span>{tab.label}</span>
            </NavLink>
          );
        })}

        <button
          type="button"
          className={cx('tabbar__item tabbar__item--button', moreActive && 'is-active')}
          onClick={() => setMoreOpen(true)}
          aria-label="Open more sections"
          aria-haspopup="dialog"
        >
          <Menu size={21} strokeWidth={2} aria-hidden="true" />
          <span>More</span>
        </button>
      </nav>

      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
