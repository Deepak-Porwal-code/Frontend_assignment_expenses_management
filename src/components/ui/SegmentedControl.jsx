import { useRef } from 'react';
import { cx } from '../../lib/cx';

export function SegmentedControl({
  options,
  value,
  onChange,
  label,
  size = 'md',
  fullWidth = false,
  className = '',
}) {
  const buttons = useRef([]);

  const handleKeyDown = (event, index) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (index + direction + options.length) % options.length;
    buttons.current[nextIndex]?.focus();
    onChange(options[nextIndex].value);
  };

  return (
    <div
      className={cx('segmented', size === 'sm' && 'segmented--sm', fullWidth && 'segmented--full', className)}
      role="group"
      aria-label={label}
    >
      {options.map((option, index) => {
        const Icon = option.icon;
        const active = option.value === value;
        return (
          <button
            key={option.value}
            ref={(element) => { buttons.current[index] = element; }}
            type="button"
            className={cx('segmented__item', active && 'is-active')}
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            tabIndex={active ? 0 : -1}
          >
            {Icon && <Icon size={14} strokeWidth={2.1} aria-hidden="true" />}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
