import { clamp } from '../../lib/format';
import { cx } from '../../lib/cx';

export function ProgressBar({ value, tone = 'accent', className = '', label }) {
  return (
    <div
      className={cx('progress', tone && `progress--${tone}`, className)}
      role="progressbar"
      aria-valuenow={Math.round(Number(value) || 0)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <span className="progress__fill" style={{ width: `${clamp(value)}%` }} />
    </div>
  );
}

const RING_COLORS = {
  accent: '#6366F1',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#0A84FF',
  neutral: '#94A3B8',
};

export function ProgressRing({
  value,
  size = 104,
  stroke = 9,
  tone = 'accent',
  color,
  children,
  className = '',
  ariaLabel,
}) {
  const percent = clamp(value);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const strokeColor = color || RING_COLORS[tone] || RING_COLORS.accent;

  return (
    <div
      className={cx('progress-ring', className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(Number(value) || 0)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="progress-ring__track"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="progress-ring__fill"
        />
      </svg>
      {children && <div className="progress-ring__content">{children}</div>}
    </div>
  );
}
