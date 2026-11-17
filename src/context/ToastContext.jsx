import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cx } from '../lib/cx';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback((type, title, message) => {
    counter.current += 1;
    const id = counter.current;

    setToasts((previous) => [
      ...previous.slice(-3),
      { id, type, title, message },
    ]);

    const timer = setTimeout(() => {
      setToasts((previous) => previous.filter((toast) => toast.id !== id));
      timers.current.delete(id);
    }, 4600);

    timers.current.set(id, timer);
    return id;
  }, []);

  useEffect(() => () => {
    timers.current.forEach((timer) => clearTimeout(timer));
  }, []);

  const toast = useMemo(() => ({
    success: (title, message) => push('success', title, message),
    error: (title, message) => push('error', title, message),
    info: (title, message) => push('info', title, message),
    dismiss,
  }), [push, dismiss]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="false">
        {toasts.map((item) => {
          const Icon = ICONS[item.type] || Info;
          return (
            <div
              key={item.id}
              className={cx('toast', `toast--${item.type}`)}
              role={item.type === 'error' ? 'alert' : 'status'}
            >
              <span className="toast__icon" aria-hidden="true">
                <Icon size={18} strokeWidth={2.2} />
              </span>
              <div className="toast__body">
                <p className="toast__title">{item.title}</p>
                {item.message && <p className="toast__message">{item.message}</p>}
              </div>
              <button
                type="button"
                className="toast__close"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss notification"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider.');
  return context;
}
