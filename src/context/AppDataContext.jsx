import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const { user, status } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accountsSummary, setAccountsSummary] = useState({ totalBalance: 0, activeCount: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  const load = useCallback(async () => {
    if (!user?._id) return;
    setLoading(true);
    setError(null);
    try {
      const [accountsPayload, categoriesPayload] = await Promise.all([
        api('/accounts'),
        api('/categories'),
      ]);
      setAccounts(accountsPayload.items);
      setAccountsSummary(accountsPayload.summary);
      setCategories(categoriesPayload.items);
    } catch (loadError) {
      setError(loadError);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    if (status === 'authenticated') {
      load();
    } else {
      setAccounts([]);
      setCategories([]);
      setAccountsSummary({ totalBalance: 0, activeCount: 0 });
      setLoading(false);
      setError(null);
    }
  }, [status, load]);

  const refreshAccounts = useCallback(async () => {
    if (!user?._id) return;
    try {
      const payload = await api('/accounts');
      setAccounts(payload.items);
      setAccountsSummary(payload.summary);
      setVersion((current) => current + 1);
    } catch (refreshError) {
      setError(refreshError);
    }
  }, [user?._id]);

  const refreshCategories = useCallback(async () => {
    if (!user?._id) return;
    try {
      const payload = await api('/categories');
      setCategories(payload.items);
      setVersion((current) => current + 1);
    } catch (refreshError) {
      setError(refreshError);
    }
  }, [user?._id]);

  const refresh = useCallback(async () => {
    await load();
    setVersion((current) => current + 1);
  }, [load]);

  const value = useMemo(() => ({
    accounts,
    accountsSummary,
    categories,
    loading,
    error,
    version,
    refresh,
    refreshAccounts,
    refreshCategories,
  }), [
    accounts,
    accountsSummary,
    categories,
    loading,
    error,
    version,
    refresh,
    refreshAccounts,
    refreshCategories,
  ]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData must be used within an AppDataProvider.');
  return context;
}
