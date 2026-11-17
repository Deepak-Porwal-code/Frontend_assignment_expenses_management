import { useId, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Gauge,
  PiggyBank,
  Plus,
  Scale,
  Sparkles,
  Target,
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { MonthSwitcher } from '../components/ui/MonthSwitcher';
import { Button, LinkButton } from '../components/ui/Button';
import { SectionHeader } from '../components/ui/SectionHeader';
import { ProgressBar, ProgressRing } from '../components/ui/Progress';
import { Amount } from '../components/ui/Amount';
import { Badge } from '../components/ui/Badge';
import { CategoryIcon } from '../components/ui/Icon';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton, ListSkeleton, StatSkeleton } from '../components/ui/Skeleton';
import { CashflowChart } from '../components/charts/CashflowChart';
import { TransactionItem } from '../components/transactions/TransactionItem';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useUI } from '../context/UIContext';
import { useResource } from '../hooks/useResource';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { api } from '../api/client';
import { currentMonthKey, formatCurrency, formatDate, formatPercent, greeting, pluralize } from '../lib/format';
import {
  BUDGET_STATUS_LABEL,
  BUDGET_STATUS_TONE,
} from '../lib/constants';
import { cx } from '../lib/cx';

const PROGRESS_TONE = {
  on_track: 'success',
  watch: 'info',
  warning: 'warning',
  critical: 'danger',
  exceeded: 'danger',
};

function StatCard({ icon: Icon, tone = 'accent', label, value, meta, children }) {
  return (
    <article className="stat-card">
      <div className="stat-card__top">
        <span className={cx('stat-card__icon', `stat-card__icon--${tone}`)} aria-hidden="true">
          <Icon size={19} strokeWidth={2} />
        </span>
        <p className="stat-card__label">{label}</p>
      </div>
      <p className="stat-card__value">{value}</p>
      {children}
      {meta && <p className="stat-card__meta">{meta}</p>}
    </article>
  );
}

function BalanceSparkline({ data }) {
  const gradientId = useId().replace(/:/g, '');
  const width = 280;
  const height = 84;
  const values = data.map((item) => item.net);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const span = max - min || 1;

  const points = values.map((value, index) => {
    const x = values.length > 1 ? (index / (values.length - 1)) * width : width / 2;
    const y = height - 8 - ((value - min) / span) * (height - 18);
    return [x, y];
  });

  const line = points.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;
  const lastPoint = points[points.length - 1] || [0, height];

  return (
    <svg
      className="balance-spark"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Six-month net cash flow trend"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke="#FFFFFF" strokeOpacity="0.82" strokeWidth="2" strokeLinecap="round" />
      <circle cx={lastPoint[0]} cy={lastPoint[1]} r="3.5" fill="#FFFFFF" />
    </svg>
  );
}

export default function DashboardPage() {
  useDocumentTitle('Dashboard');

  const { user } = useAuth();
  const { version } = useAppData();
  const { openTransactionModal } = useUI();
  const [month, setMonth] = useState(currentMonthKey());
  const currency = user?.currency || 'USD';

  const { data, loading, error, reload } = useResource(
    () => api(`/dashboard?month=${month}`),
    [month, version],
  );

  const firstName = user?.name?.split(' ')[0] || 'there';

  const header = (
    <PageHeader
      eyebrow={formatDate(new Date(), 'full')}
      title={`${greeting()}, ${firstName}`}
      description="Here’s how your money is doing this month."
      actions={(
        <>
          <MonthSwitcher month={month} onChange={setMonth} />
          <Button icon={Plus} onClick={() => openTransactionModal()}>
            Add transaction
          </Button>
        </>
      )}
    />
  );

  if (loading && !data) {
    return (
      <div className="page-stack">
        {header}
        <Skeleton height={188} radius={28} />
        <div className="stats-grid">
          {Array.from({ length: 4 }, (_item, index) => <StatSkeleton key={index} />)}
        </div>
        <div className="dashboard-grid">
          <div className="panel"><Skeleton width="30%" height={16} /><Skeleton height={230} radius={18} /></div>
          <div className="panel"><Skeleton width="45%" height={16} /><ListSkeleton rows={4} /></div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="page-stack">
        {header}
        <ErrorState error={error} onRetry={reload} title="We couldn’t load your dashboard" />
      </div>
    );
  }

  const {
    totals,
    monthTotals,
    accountsSummary,
    budget,
    budgetAlerts,
    recentTransactions,
    overview,
    topCategories,
    goals,
  } = data;

  const budgetPercent = budget?.percent || 0;
  const budgetTone = budget ? PROGRESS_TONE[budget.status] || 'accent' : 'accent';

  return (
    <div className="page-stack">
      {header}

      <section className="balance-card" aria-label="Total balance">
        <div className="balance-card__main">
          <p className="balance-card__label">Total balance</p>
          <p className="balance-card__value">{formatCurrency(totals.balance, currency)}</p>
          <div className="balance-card__meta">
            <span className={cx(
              'balance-card__chip',
              monthTotals.net < 0 && 'is-negative',
            )}>
              {monthTotals.net >= 0 ? '↑' : '↓'} {formatCurrency(Math.abs(monthTotals.net), currency, { signed: false })}
              <span>net this month</span>
            </span>
            <span className="balance-card__accounts">
              Across {pluralize(accountsSummary.activeCount, 'active account')}
            </span>
          </div>
          <div className="balance-card__actions">
            <Button variant="inverse" size="sm" icon={Plus} onClick={() => openTransactionModal()}>
              Add transaction
            </Button>
            <LinkButton to="/transactions" size="sm" variant="glass">
              View activity
            </LinkButton>
          </div>
        </div>
        <div className="balance-card__chart">
          <span className="balance-card__chart-label">Last 6 months</span>
          <BalanceSparkline data={overview} />
        </div>
      </section>

      <div className="stats-grid">
        <StatCard
          icon={ArrowDownLeft}
          tone="income"
          label="Income · this month"
          value={<Amount value={monthTotals.income} type="income" currency={currency} />}
          meta={data.monthLabel}
        />
        <StatCard
          icon={ArrowUpRight}
          tone="expense"
          label="Expenses · this month"
          value={<Amount value={monthTotals.expense} type="expense" currency={currency} />}
          meta={data.monthLabel}
        />
        <StatCard
          icon={Scale}
          tone={monthTotals.net >= 0 ? 'accent' : 'expense'}
          label="Net this month"
          value={<Amount value={monthTotals.net} type={monthTotals.net >= 0 ? 'income' : 'expense'} currency={currency} />}
          meta="Income minus expenses"
        />
        <StatCard
          icon={Target}
          tone={budget ? (budgetPercent >= 90 ? 'expense' : 'accent') : 'muted'}
          label="Budget remaining"
          value={budget ? formatCurrency(budget.remaining, currency) : 'Not set'}
          meta={budget ? `${formatPercent(budgetPercent)} used of ${formatCurrency(budget.amount, currency, { whole: true })}` : 'Set one to track your month'}
        >
          {budget && <ProgressBar value={budgetPercent} tone={budgetTone} className="stat-card__progress" label="Budget used" />}
        </StatCard>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-grid__main">
          <section className="panel">
            <SectionHeader
              title="Cash flow"
              description="Income and spending over the last six months."
            />
            {overview?.length ? (
              <CashflowChart data={overview} currency={currency} height={252} />
            ) : (
              <EmptyState icon={Sparkles} title="No cash flow yet" description="Add your first transaction to see the trend." compact />
            )}
          </section>

          <section className="panel">
            <SectionHeader
              title="Recent activity"
              description="Your latest movements, newest first."
              action={<LinkButton to="/transactions" size="sm" variant="ghost" iconRight={ArrowRight}>View all</LinkButton>}
            />
            {recentTransactions?.length ? (
              <div className="tx-list">
                {recentTransactions.map((transaction) => (
                  <TransactionItem
                    key={transaction._id}
                    transaction={transaction}
                    currency={currency}
                    onSelect={(item) => openTransactionModal(item)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Sparkles}
                title="A clean slate"
                description="Add your first transaction and Moneta will start making sense of your month."
                action={<Button size="sm" icon={Plus} onClick={() => openTransactionModal()}>Add transaction</Button>}
                compact
              />
            )}
          </section>
        </div>

        <div className="dashboard-grid__side">
          <section className="panel">
            <SectionHeader
              title="Monthly budget"
              action={<LinkButton to="/budgets" size="sm" variant="ghost">Manage</LinkButton>}
            />
            {budget ? (
              <div className="budget-mini">
                <div className="budget-mini__top">
                  <ProgressRing
                    value={budgetPercent}
                    size={104}
                    stroke={9}
                    tone={budgetTone}
                    ariaLabel={`${formatPercent(budgetPercent)} of budget used`}
                  >
                    <span className="budget-mini__percent">{formatPercent(budgetPercent)}</span>
                    <span className="budget-mini__percent-label">used</span>
                  </ProgressRing>
                  <div className="budget-mini__figures">
                    <p className="budget-mini__spent">
                      {formatCurrency(budget.spent, currency, { whole: true })}
                      <span> spent</span>
                    </p>
                    <p className="budget-mini__total">
                      of {formatCurrency(budget.amount, currency, { whole: true })}
                    </p>
                    <Badge tone={BUDGET_STATUS_TONE[budget.status]} size="sm" dot>
                      {BUDGET_STATUS_LABEL[budget.status]}
                    </Badge>
                  </div>
                </div>
                <p className={cx('budget-mini__message', budget.percent >= 75 && 'is-alert')}>
                  {budget.message}
                </p>
                {budgetAlerts?.length > 0 && (
                  <ul className="budget-alerts" aria-label="Category budget alerts">
                    {budgetAlerts.map((alert) => (
                      <li key={alert._id}>
                        <span
                          className="budget-alerts__dot"
                          style={{ background: alert.category?.color || '#F59E0B' }}
                          aria-hidden="true"
                        />
                        <span>{alert.category?.name}</span>
                        <strong>{formatPercent(alert.percent)}</strong>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <EmptyState
                icon={Gauge}
                title="No budget yet"
                description="A monthly budget turns spending into a gentle guardrail."
                action={<LinkButton to="/budgets" size="sm">Set a budget</LinkButton>}
                compact
              />
            )}
          </section>

          <section className="panel">
            <SectionHeader title="Top categories" description={`Where your money went in ${data.monthLabel}.`} />
            {topCategories?.length ? (
              <ul className="category-list">
                {topCategories.map((category) => (
                  <li className="category-list__row" key={category.categoryId || category.name}>
                    <CategoryIcon category={category} size="sm" />
                    <span className="category-list__name">
                      {category.name}
                      <span className="category-list__count">{pluralize(category.count, 'entry', 'entries')}</span>
                    </span>
                    <span className="category-list__amount">
                      {formatCurrency(category.total, currency, { whole: true })}
                    </span>
                    <span className="category-list__track" aria-hidden="true">
                      <span
                        className="category-list__fill"
                        style={{
                          width: `${Math.min(100, category.percent)}%`,
                          background: category.color,
                        }}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={PiggyBank} title="Nothing spent yet" description="Expense categories will show up here." compact />
            )}
          </section>

          <section className="panel">
            <SectionHeader
              title="Savings goals"
              action={<LinkButton to="/goals" size="sm" variant="ghost">All goals</LinkButton>}
            />
            {goals?.length ? (
              <ul className="goal-mini-list">
                {goals.map((goal) => (
                  <li key={goal._id} className="goal-mini">
                    <div className="goal-mini__row">
                      <span className="goal-mini__dot" style={{ background: goal.color }} aria-hidden="true" />
                      <span className="goal-mini__name">{goal.name}</span>
                      <span className="goal-mini__percent">{formatPercent(goal.percent)}</span>
                    </div>
                    <ProgressBar value={goal.percent} tone="accent" label={`${goal.name} progress`} />
                    <p className="goal-mini__amounts">
                      {formatCurrency(goal.currentAmount, currency, { whole: true })}
                      <span> of {formatCurrency(goal.targetAmount, currency, { whole: true })}</span>
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={PiggyBank}
                title="No goals yet"
                description="Save toward something that matters."
                action={<LinkButton to="/goals" size="sm">Create a goal</LinkButton>}
                compact
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
