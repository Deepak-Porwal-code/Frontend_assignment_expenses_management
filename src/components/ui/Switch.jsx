import { cx } from '../../lib/cx';

export function Switch({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  ariaLabel,
  id,
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={cx('switch', checked && 'is-on', size === 'sm' && 'switch--sm')}
      onClick={() => onChange(!checked)}
      disabled={disabled}
    >
      <span className="switch__thumb" aria-hidden="true" />
    </button>
  );
}
