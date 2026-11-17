import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { api } from '../api/client';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');
  const toast = useToast();
  const sessionExpired = useRef(false);

  useEffect(() => {
    let active = true;

    api('/auth/me', { skipAuthEvent: true })
      .then((payload) => {
        if (!active) return;
        setUser(payload.user);
        setStatus('authenticated');
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        setStatus('guest');
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      if (sessionExpired.current) return;
      sessionExpired.current = true;
      setUser(null);
      setStatus('guest');
      toast.error('Session expired', 'Please sign in again to continue.');
    };

    window.addEventListener('moneta:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('moneta:unauthorized', handleUnauthorized);
  }, [toast]);

  const login = useCallback(async (email, password) => {
    const payload = await api('/auth/login', {
      method: 'POST',
      body: { email, password },
      skipAuthEvent: true,
    });
    sessionExpired.current = false;
    setUser(payload.user);
    setStatus('authenticated');
    toast.success(`Welcome back, ${payload.user.name.split(' ')[0]}`);
    return payload.user;
  }, [toast]);

  const register = useCallback(async (name, email, password) => {
    const payload = await api('/auth/register', {
      method: 'POST',
      body: { name, email, password },
      skipAuthEvent: true,
    });
    sessionExpired.current = false;
    setUser(payload.user);
    setStatus('authenticated');
    toast.success('Welcome to Moneta', 'Your account is ready. Add your first transaction.');
    return payload.user;
  }, [toast]);

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      // The local session is cleared even if the network request fails.
    }
    setUser(null);
    setStatus('guest');
    toast.info('Signed out', 'See you again soon.');
  }, [toast]);

  const updateUser = useCallback((nextUser) => {
    setUser((previous) => ({ ...previous, ...nextUser }));
  }, []);

  const value = useMemo(() => ({
    user,
    status,
    isAuthenticated: status === 'authenticated',
    login,
    register,
    logout,
    updateUser,
  }), [user, status, login, register, logout, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider.');
  return context;
}
