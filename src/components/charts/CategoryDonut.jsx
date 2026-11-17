import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Link } from 'react-router-dom';
import { CategoryIcon } from '../ui/Icon';
import { ChartTooltip } from './ChartPrimitives';
import { formatCurrency, formatPercent } from '../../lib/format';
import { CHART_COLORS } from '../../lib/constants';

export function CategoryDonut({ data, total, currency = 'USD', size = 216, getHref }) {
  return (
    <div className="donut">
      <div className="donut__chart" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="name"
              innerRadius="66%"
              outerRadius="94%"
              paddingAngle={2}
              cornerRadius={7}
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.categoryId || entry.name}
                  fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip currency={currency} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut__center" aria-hidden="true">
          <span className="donut__center-label">Spent</span>
          <strong className="donut__center-value">
            {formatCurrency(total, currency, { whole: true })}
          </strong>
        </div>
      </div>

      <ul className="donut__legend">
        {data.map((entry, index) => {
          const href = getHref && entry.categoryId ? getHref(entry) : null;
          const row = (
            <>
              <CategoryIcon category={entry} size="sm" />
              <span className="donut__legend-name">
                {entry.name}
                <span className="donut__legend-count">
                  {entry.count} {entry.count === 1 ? 'transaction' : 'transactions'}
                </span>
              </span>
              <span className="donut__legend-values">
                <strong>{formatCurrency(entry.total, currency, { whole: true })}</strong>
                <span
                  className="donut__legend-percent"
                  style={{ color: entry.color || CHART_COLORS[index % CHART_COLORS.length] }}
                >
                  {formatPercent(entry.percent, entry.percent < 10 ? 1 : 0)}
                </span>
              </span>
            </>
          );

          return (
            <li className="donut__legend-row" key={entry.categoryId || entry.name}>
              {href ? (
                <Link className="donut__legend-link" to={href}>{row}</Link>
              ) : row}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
