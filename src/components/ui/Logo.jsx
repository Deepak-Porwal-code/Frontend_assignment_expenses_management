import { useId } from 'react';
import { cx } from '../../lib/cx';

export function LogoMark({ size = 36, className = '' }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={cx('logo-mark', className)}
      role="img"
      aria-label="Moneta"
    >
      <defs>
        <linearGradient id={id} x1="8" y1="6" x2="58" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B7DFF" />
          <stop offset="0.55" stopColor="#6C5CE7" />
          <stop offset="1" stopColor="#4338CA" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="17" fill={`url(#${id})`} />
      <rect x="17" y="35" width="7" height="13" rx="3.5" fill="white" fillOpacity="0.82" />
      <rect x="28.5" y="27" width="7" height="21" rx="3.5" fill="white" />
      <rect x="40" y="18" width="7" height="30" rx="3.5" fill="white" fillOpacity="0.9" />
    </svg>
  );
}

export function Logo({ size = 36, light = false, compact = false, className = '' }) {
  return (
    <span className={cx('brand', light && 'brand--light', compact && 'brand--compact', className)}>
      <LogoMark size={size} />
      {!compact && (
        <span className="brand__name">
          moneta<span className="brand__dot">.</span>
        </span>
      )}
    </span>
  );
}
