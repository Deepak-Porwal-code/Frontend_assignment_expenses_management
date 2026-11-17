import { CloudOff, RotateCw } from 'lucide-react';
import { Button } from './Button';
import { cx } from '../../lib/cx';

export function ErrorState({
  error,
  title = 'We couldn’t load this',
  onRetry,
  className = '',
}) {
  const message = error?.message || 'Check your connection and try again.';

  return (
    <div className={cx('error-state', className)} role="alert">
      <span className="error-state__icon" aria-hidden="true">
        <CloudOff size={22} strokeWidth={1.9} />
      </span>
      <div className="error-state__text">
        <p className="error-state__title">{title}</p>
        <p className="error-state__message">{message}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" icon={RotateCw} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
