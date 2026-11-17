import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogoMark } from '../ui/Logo';

function SplashScreen() {
  return (
    <div className="splash" role="status" aria-label="Loading Moneta">
      <LogoMark size={46} className="splash__mark" />
      <span className="splash__bar" aria-hidden="true">
        <span />
      </span>
    </div>
  );
}

export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <SplashScreen />;

  if (status !== 'authenticated') {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to="/login" replace state={{ from }} />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { status } = useAuth();

  if (status === 'loading') return <SplashScreen />;
  if (status === 'authenticated') return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
