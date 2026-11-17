import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonthsToKey, currentMonthKey, formatMonthKey } from '../../lib/format';
import { cx } from '../../lib/cx';

export function MonthSwitcher({ month, onChange, className = '' }) {
  const isCurrent = month >= currentMonthKey();

  return (
    <div className={cx('month-switcher', className)}>
      <button
        type="button"
        className="month-switcher__arrow"
        onClick={() => onChange(addMonthsToKey(month, -1))}
        aria-label="Previous month"
      >
        <ChevronLeft size={16} strokeWidth={2.3} />
      </button>
      <span className="month-switcher__label" aria-live="polite">
        <CalendarDays size={15} strokeWidth={2} aria-hidden="true" />
        {formatMonthKey(month)}
      </span>
      <button
        type="button"
        className="month-switcher__arrow"
        onClick={() => onChange(addMonthsToKey(month, 1))}
        aria-label="Next month"
        disabled={isCurrent}
      >
        <ChevronRight size={16} strokeWidth={2.3} />
      </button>
    </div>
  );
}
