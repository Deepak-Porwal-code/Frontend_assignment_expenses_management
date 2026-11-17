import { useTheme } from '../../context/ThemeContext';
import { formatCurrency } from '../../lib/format';
import { cx } from '../../lib/cx';

/** Colour tokens that Recharts can't read from CSS variables. */
export function useChartColors() {
  const { resolved } = useTheme();
  const dark = resolved === 'dark';

  return {
    dark,
    axis: dark ? '#8E8E99' : '#8A8D98',
    grid: dark ? 'rgba(255,255,255,0.07)' : 'rgba(17,24,39,0.07)',
    hover: dark ? 'rgba(255,255,255,0.04)' : 'rgba(17,24,39,0.035)',
    tooltipBorder: dark ? 'rgba(255,255,255,0.1)' : 'rgba(17,24,39,0.08)',
    tooltipBg: dark ? '#18181F' : '#FFFFFF',
    dotStroke: dark ? '#14141A' : '#FFFFFF',
  };
}

export function ChartTooltip({ active, payload, label, currency = 'USD' }) {
  if (!active || !payload?.length) return null;

  const title = payload[0]?.payload?.fullLabel || label;

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{title}</p>
      <div className="chart-tooltip__rows">
        {payload.map((item) => (
          <div className="chart-tooltip__row" key={item.dataKey || item.name}>
            <span
              className="chart-tooltip__dot"
              style={{ background: item.color || item.fill }}
              aria-hidden="true"
            />
            <span className="chart-tooltip__name">{item.name}</span>
            <strong className="chart-tooltip__value">
              {formatCurrency(item.value, currency)}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartLegend({ items, className = '' }) {
  return (
    <div className={cx('chart-legend', className)}>
      {items.map((item) => (
        <span className="chart-legend__item" key={item.label}>
          <span
            className="chart-legend__dot"
            style={{ background: item.color }}
            aria-hidden="true"
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}
