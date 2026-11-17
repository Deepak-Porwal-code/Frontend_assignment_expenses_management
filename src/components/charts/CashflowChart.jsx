import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartLegend, ChartTooltip, useChartColors } from './ChartPrimitives';
import { formatCurrency } from '../../lib/format';

export function CashflowChart({ data, currency = 'USD', height = 268 }) {
  const colors = useChartColors();

  return (
    <div className="chart-block">
      <ChartLegend
        items={[
          { label: 'Income', color: '#22C55E' },
          { label: 'Expenses', color: '#F43F5E' },
        ]}
        className="chart-block__legend"
      />
      <div className="chart-canvas" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barGap={5}>
            <CartesianGrid vertical={false} stroke={colors.grid} strokeDasharray="3 7" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: colors.axis, fontSize: 11.5 }}
              dy={8}
              interval="preserveStartEnd"
              minTickGap={12}
            />
            <YAxis
              width={48}
              tickLine={false}
              axisLine={false}
              tick={{ fill: colors.axis, fontSize: 11.5 }}
              tickFormatter={(value) => formatCurrency(value, currency, { compact: true })}
            />
            <Tooltip
              cursor={{ fill: colors.hover }}
              content={<ChartTooltip currency={currency} />}
            />
            <Bar
              dataKey="income"
              name="Income"
              fill="#22C55E"
              radius={[5, 5, 5, 5]}
              maxBarSize={18}
            />
            <Bar
              dataKey="expense"
              name="Expenses"
              fill="#F43F5E"
              radius={[5, 5, 5, 5]}
              maxBarSize={18}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
