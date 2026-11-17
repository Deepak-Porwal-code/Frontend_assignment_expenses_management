import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownRight,
  ArrowUpRight,
  ChartPie,
  Minus,
  Percent,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton, StatSkeleton } from '../components/ui/Skeleton';
import { TrendChart } from '../components/charts/TrendChart';
import { CategoryDonut } from '../components/charts/CategoryDonut';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useResource } from '../hooks/useResource';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { api } from '../api/client';
import { RANGE_OPTIONS } from '../lib/constants';
import {
  formatCurrency,
  formatPercent,
} from '../lib/format';
import { cx } from '../lib/cx';

function DeltaBadge({ change, invert = false }) {
  if (change === null || change === undefined) {
    return <Badge tone="neutral" size="sm">No prior data</Badge>;
  }

  if (Math.abs(change) < 0.1) {
    return <Badge tone="neutral" size="sm" icon={Minus}>No change</Badge>;
  }

  const rising = change > 0;
  const good = invert ? !rising : rising;

  return (
    <Badge tone={good ? 'success' : 'danger'} size="sm" icon={rising ? ArrowUpRight : ArrowDownRight}>
      {formatPercent(Math.abs(change), 1)} vs previous
    </Badge>
  );
}

function MetricCard({ icon: Icon, label, value, meta, children, tone = 'accent' }) {
  return (
    <article className="stat-card">
      <div className="stat-card__top">
        <span className={cx('stat-card__icon', `stat-card__icon--${tone}`)} aria-hidden="true">
          <Icon size={19} strokeWidth={2} />
        </span>
        <p className="stat-card__label">{label}</p>
      </div>
      <p className="stat-card__value">{value}</p>
      <div className="stat-card__footer">
        {children}
        {meta && <span className="stat-card__meta">{meta}</span>}
      </div>
    </article>
  );
}

export default function AnalyticsPage() {
  useDocumentTitle('Analytics');

  const { user } = useAuth();
  const { version } = useAppData();
  const [range, setRange] = useState('month');
  const currency = user?.currency || 'USD';

  const { data, loading, error, reload } = useResource(
    () => api(`/analytics?range=${range}`),
    [range, version],
  );

  const header = (
    <PageHeader
      eyebrow="Insights"
      title="Analytics"
      description="The story behind your numbers — trends, categories and how this period compares."
      actions={(
        <SegmentedControl
          options={RANGE_OPTIONS}
          value={range}
          onChange={setRange}
          label="Analytics range"
          size="sm"
        />
      )}
    />
  );

  if (loading && !data) {
    return (
      <div className="page-stack">
        {header}
        <div className="stats-grid">
          {Array.from({ length: 4 }, (_item, index) => <StatSkeleton key={index} />)}
        </div>
        <div className="panel"><Skeleton width="25%" height={15} /><Skeleton height={290} radius={18} /></div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="page-stack">
        {header}
        <ErrorState error={error} onRetry={reload} title="We couldn’t load your analytics" />
      </div>
    );
  }

  const { summary, comparison, trend, breakdown, period } = data;
  const hasBreakdown = breakdown.length > 0;

  return (
    <div className="page-stack">
      {header}

      <div className="stats-grid">
        <MetricCard
          icon={TrendingUp}
          tone="income"
          label="Income"
          value={formatCurrency(summary.income, currency)}
        >
          <DeltaBadge change={comparison.incomeChange} />
        </MetricCard>
        <MetricCard
          icon={TrendingDown}
          tone="expense"
          label="Expenses"
          value={formatCurrency(summary.expense, currency)}
        >
          <DeltaBadge change={comparison.expenseChange} invert />
        </MetricCard>
        <MetricCard
          icon={Wallet}
          tone={summary.net >= 0 ? 'accent' : 'expense'}
          label="Net"
          value={formatCurrency(summary.net, currency)}
        >
          <DeltaBadge change={comparison.netChange} />
        </MetricCard>
        <MetricCard
          icon={Percent}
          tone="info"
          label="Savings rate"
          value={formatPercent(summary.savingsRate, 1)}
          meta={`${formatCurrency(summary.averageDailySpend, currency)} avg / day`}
        >
          <Badge tone={summary.savingsRate >= 20 ? 'success' : summary.savingsRate >= 0 ? 'warning' : 'danger'} size="sm">
            {summary.savingsRate >= 20 ? 'Healthy' : summary.savingsRate >= 0 ? 'Room to grow' : 'Spending more'}
          </Badge>
        </MetricCard>
      </div>

      <section className="panel">
        <SectionHeader
          title="Cash flow trend"
          description={period.label}
          action={(
            <span className="section-header__note">
              {summary.transactions} {summary.transactions === 1 ? 'transaction' : 'transactions'}
            </span>
          )}
        />
        {trend.some((point) => point.income > 0 || point.expense > 0) ? (
          <TrendChart data={trend} currency={currency} height={310} />
        ) : (
          <EmptyState
            icon={Sparkles}
            title="No activity in this period"
            description="Add a transaction or switch the range to see your trend."
            compact
          />
        )}
      </section>

      <div className="analytics-grid">
        <section className="panel">
          <SectionHeader
            title="Where it went"
            description="Expenses by category for this period."
            action={hasBreakdown ? (
              <Link
                className="section-header__link"
                to={`/transactions?type=expense&from=${period.start}&to=${period.end}`}
              >
                View transactions
              </Link>
            ) : null}
          />
          {hasBreakdown ? (
            <CategoryDonut
              data={breakdown}
              total={summary.expense}
              currency={currency}
              getHref={(entry) => `/transactions?type=expense&category=${entry.categoryId}&from=${period.start}&to=${period.end}`}
            />
          ) : (
            <EmptyState
              icon={ChartPie}
              title="No expenses to break down"
              description="Once you record spending, categories will appear here."
              compact
            />
          )}
        </section>

        <section className="panel">
          <SectionHeader
            title="Compared with before"
            description="The period immediately before this one."
          />
          <ul className="comparison">
            {[
              { key: 'income', label: 'Income', current: summary.income, previous: comparison.previous.income, change: comparison.incomeChange },
              { key: 'expense', label: 'Expenses', current: summary.expense, previous: comparison.previous.expense, change: comparison.expenseChange, invert: true },
              { key: 'net', label: 'Net', current: summary.net, previous: comparison.previous.net, change: comparison.netChange },
            ].map((row) => (
              <li className="comparison__row" key={row.key}>
                <div className="comparison__label">
                  <span>{row.label}</span>
                  {row.change !== null && row.change !== undefined && Math.abs(row.change) >= 0.1 && (
                    <span className={cx(
                      'comparison__change',
                      (row.invert ? row.change < 0 : row.change > 0) ? 'is-good' : 'is-bad',
                    )}>
                      {row.change > 0 ? '+' : ''}{formatPercent(row.change, 1)}
                    </span>
                  )}
                </div>
                <div className="comparison__values">
                  <span className="comparison__current">{formatCurrency(row.current, currency)}</span>
                  <span className="comparison__previous">
                    was {formatCurrency(row.previous, currency)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <div className="analytics-note">
            <Sparkles size={15} strokeWidth={2} aria-hidden="true" />
            <p>
              Saving {formatPercent(Math.max(0, summary.savingsRate), 0)} of your income this period.
              A common target is 20%.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
