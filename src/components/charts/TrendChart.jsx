import { useId } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartLegend, ChartTooltip, useChartColors } from './ChartPrimitives';
import { useReducedMotion } from '../../hooks/useMediaQuery';
import { formatCurrency } from '../../lib/format';

export function TrendChart({ data, currency = 'USD', height = 300 }) {
  const colors = useChartColors();
  const reduced = useReducedMotion();
  const gradientId = useId().replace(/:/g, '');

  return (
    <div className="chart-block">
      <ChartLegend
        items={[
          { label: 'Income', color: '#22C55E' },
          { label: 'Expenses', color: '#F43F5E' },
        ]}
        className="chart-block__legend"
      />
      <div
        className="chart-canvas"
        style={{ height }}
        role="img"
        aria-label={`Income and expenses trend over ${data.length} points, area chart.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`${gradientId}-income`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22C55E" stopOpacity={0.26} />
                <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
              </linearGradient>
              <linearGradient id={`${gradientId}-expense`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#F43F5E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={colors.grid} strokeDasharray="3 7" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: colors.axis, fontSize: 11.5 }}
              dy={8}
              interval="preserveStartEnd"
              minTickGap={22}
            />
            <YAxis
              width={48}
              tickLine={false}
              axisLine={false}
              tick={{ fill: colors.axis, fontSize: 11.5 }}
              tickFormatter={(value) => formatCurrency(value, currency, { compact: true })}
            />
            <Tooltip
              cursor={{ stroke: colors.grid, strokeWidth: 1 }}
              content={<ChartTooltip currency={currency} />}
            />
            <Area
              type="monotone"
              dataKey="income"
              name="Income"
              stroke="#22C55E"
              strokeWidth={2.2}
              fill={`url(#${gradientId}-income)`}
              activeDot={{ r: 4, strokeWidth: 2, stroke: colors.dotStroke }}
              dot={false}
              isAnimationActive={!reduced}
            />
            <Area
              type="monotone"
              dataKey="expense"
              name="Expenses"
              stroke="#F43F5E"
              strokeWidth={2.2}
              fill={`url(#${gradientId}-expense)`}
              activeDot={{ r: 4, strokeWidth: 2, stroke: colors.dotStroke }}
              dot={false}
              isAnimationActive={!reduced}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
