import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cx } from '../../lib/cx';

const VARIANTS = ['primary', 'secondary', 'ghost', 'soft', 'danger', 'danger-soft', 'inverse', 'glass'];
const SIZES = ['sm', 'md', 'lg'];

function classes({ variant = 'primary', size = 'md', fullWidth, iconOnly, className }) {
  return cx(
    'btn',
    VARIANTS.includes(variant) && `btn--${variant}`,
    SIZES.includes(size) && `btn--${size}`,
    fullWidth && 'btn--full',
    iconOnly && 'btn--icon',
    className,
  );
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon: Icon,
  iconRight: IconRight,
  className = '',
  type = 'button',
  disabled,
  ...props
}) {
  return (
    <button
      type={type}
      className={classes({ variant, size, fullWidth, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <Loader2 size={16} className="spin" aria-hidden="true" />
      ) : (
        Icon && <Icon size={size === 'sm' ? 15 : 17} strokeWidth={2.1} aria-hidden="true" />
      )}
      {children && <span>{children}</span>}
      {!loading && IconRight && <IconRight size={16} strokeWidth={2.1} aria-hidden="true" />}
    </button>
  );
}

export function IconButton({
  label,
  icon: Icon,
  variant = 'ghost',
  size = 'md',
  className = '',
  loading = false,
  ...props
}) {
  return (
    <button
      type="button"
      className={classes({ variant, size, iconOnly: true, className })}
      aria-label={label}
      title={label}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 size={16} className="spin" aria-hidden="true" />
      ) : (
        <Icon size={size === 'sm' ? 15 : 18} strokeWidth={2} aria-hidden="true" />
      )}
    </button>
  );
}

export function LinkButton({
  to,
  children,
  variant = 'secondary',
  size = 'md',
  fullWidth = false,
  icon: Icon,
  iconRight: IconRight,
  className = '',
  ...props
}) {
  return (
    <Link
      to={to}
      className={classes({ variant, size, fullWidth, className })}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 15 : 17} strokeWidth={2.1} aria-hidden="true" />}
      {children && <span>{children}</span>}
      {IconRight && <IconRight size={16} strokeWidth={2.1} aria-hidden="true" />}
    </Link>
  );
}
