import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'moneta-theme';

function readStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
  } catch {
    return 'system';
  }
}

export function ThemeProvider({ children }) {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const [setting, setSetting] = useState(readStoredTheme);

  const resolved = setting === 'system' ? (prefersDark ? 'dark' : 'light') : setting;

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', resolved === 'dark' ? '#0b0b0f' : '#f6f6f8');
  }, [resolved]);

  const setTheme = useCallback((theme) => {
    if (!['light', 'dark', 'system'].includes(theme)) return;
    setSetting(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage can be unavailable in private browsing; the in-memory theme still works.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolved === 'dark' ? 'light' : 'dark');
  }, [resolved, setTheme]);

  const value = useMemo(() => ({
    setting,
    resolved,
    setTheme,
    toggleTheme,
  }), [setting, resolved, setTheme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider.');
  return context;
}
