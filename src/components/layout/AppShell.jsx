import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileTopbar } from './MobileTopbar';
import { MobileTabBar } from './MobileTabBar';
import { TransactionFormModal } from '../transactions/TransactionFormModal';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { PAGE_TITLES } from '../../lib/constants';

export function AppShell() {
  const { pathname } = useLocation();
  useDocumentTitle(PAGE_TITLES[pathname] || 'Page not found');

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Sidebar />

      <div className="app-frame">
        <MobileTopbar />
        <main id="main-content" className="app-main" tabIndex={-1}>
          <div className="page-container">
            <Outlet />
          </div>
        </main>
      </div>

      <MobileTabBar />
      <TransactionFormModal />
    </div>
  );
}
