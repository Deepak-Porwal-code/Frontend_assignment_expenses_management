import { cx } from '../../lib/cx';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
  className = '',
}) {
  return (
    <div className={cx('empty-state', compact && 'empty-state--compact', className)}>
      {Icon && (
        <span className="empty-state__icon" aria-hidden="true">
          <Icon size={compact ? 19 : 23} strokeWidth={1.9} />
        </span>
      )}
      <p className="empty-state__title">{title}</p>
      {description && <p className="empty-state__description">{description}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}
