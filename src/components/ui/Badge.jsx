import { cx } from '../../lib/cx';

const TONES = ['neutral', 'accent', 'success', 'danger', 'warning', 'info'];

export function Badge({ children, tone = 'neutral', icon: Icon, dot = false, className = '', size = 'md' }) {
  return (
    <span className={cx('badge', TONES.includes(tone) && `badge--${tone}`, size === 'sm' && 'badge--sm', className)}>
      {dot && <span className="badge__dot" aria-hidden="true" />}
      {Icon && <Icon size={12} strokeWidth={2.4} aria-hidden="true" />}
      {children}
    </span>
  );
}
