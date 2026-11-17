import { useState } from 'react';
import {
  AlertTriangle,
  Gauge,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { MonthSwitcher } from '../components/ui/MonthSwitcher';
import { Button, IconButton, LinkButton } from '../components/ui/Button';
import { SectionHeader } from '../components/ui/SectionHeader';
import { ProgressBar, ProgressRing } from '../components/ui/Progress';
import { Badge } from '../components/ui/Badge';
import { CategoryIcon } from '../components/ui/Icon';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton } from '../components/ui/Skeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { BudgetFormModal } from '../components/budgets/BudgetFormModal';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import { useResource } from '../hooks/useResource';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { api } from '../api/client';
import { currentMonthKey, formatCurrency, formatPercent, formatMonthKey } from '../lib/format';
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

function CategoryBudgetCard({ budget, currency, onEdit, onDelete }) {
  return (
    <article className="budget-card">
      <div className="budget-card__header">
        <div className="budget-card__identity">
          <CategoryIcon category={budget.category} size="sm" />
          <div>
            <p className="budget-card__name">{budget.category?.name}</p>
            <p className="budget-card__amount">
              {formatCurrency(budget.spent, currency, { whole: true })}
              <span> of {formatCurrency(budget.amount, currency, { whole: true })}</span>
            </p>
          </div>
        </div>
        <div className="budget-card__actions">
          <IconButton label={`Edit ${budget.category?.name} budget`} icon={Pencil} size="sm" onClick={onEdit} />
          <IconButton
            label={`Delete ${budget.category?.name} budget`}
            icon={Trash2}
            size="sm"
            className="icon-button--danger"
            onClick={onDelete}
          />
        </div>
      </div>

      <ProgressBar
        value={budget.percent}
        tone={PROGRESS_TONE[budget.status] || 'accent'}
        label={`${budget.category?.name} budget used`}
      />

      <div className="budget-card__footer">
        <Badge tone={BUDGET_STATUS_TONE[budget.status]} size="sm" dot>
          {BUDGET_STATUS_LABEL[budget.status]}
        </Badge>
        <span className={cx('budget-card__remaining', budget.remaining < 0 && 'is-negative')}>
          {budget.remaining >= 0
            ? `${formatCurrency(budget.remaining, currency, { whole: true })} left`
            : `${formatCurrency(Math.abs(budget.remaining), currency, { whole: true })} over`}
        </span>
        <span className="budget-card__percent">{formatPercent(budget.percent)}</span>
      </div>
    </article>
  );
}

export default function BudgetsPage() {
  useDocumentTitle('Budgets');

  const { user } = useAuth();
  const { categories, version } = useAppData();
  const toast = useToast();
  const [month, setMonth] = useState(currentMonthKey());
  const [editor, setEditor] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const currency = user?.currency || 'USD';
  const monthLabel = formatMonthKey(month);

  const { data, loading, error, reload } = useResource(
    () => api(`/budgets?month=${month}`),
    [month, version],
  );

  const expenseCategories = categories.filter((category) => category.type === 'expense');
  const existingCategoryIds = (data?.categories || [])
    .map((budget) => budget.category?._id)
    .filter(Boolean);

  const openOverall = () => setEditor({ scope: 'overall', budget: data?.overall || null });
  const openNewCategory = () => setEditor({ scope: 'category', budget: null });
  const openCategory = (budget) => setEditor({ scope: 'category', budget });

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api(`/budgets/${pendingDelete._id}`, { method: 'DELETE' });
      toast.success('Budget removed', 'You can always set a new one.');
      setPendingDelete(null);
      await reload();
    } catch (deleteError) {
      toast.error('Could not remove budget', deleteError.message);
    } finally {
      setDeleting(false);
    }
  };

  const header = (
    <PageHeader
      eyebrow="Plan"
      title="Budgets"
      description="Gentle guardrails for your month — set a cap and we’ll warn you before you cross it."
      actions={(
        <>
          <MonthSwitcher month={month} onChange={setMonth} />
          <Button icon={Plus} onClick={openNewCategory}>Add category budget</Button>
        </>
      )}
    />
  );

  if (loading && !data) {
    return (
      <div className="page-stack">
        {header}
        <Skeleton height={200} radius={26} />
        <div className="budget-grid">
          {Array.from({ length: 4 }, (_item, index) => (
            <Skeleton key={index} height={150} radius={20} />
          ))}
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="page-stack">
        {header}
        <ErrorState error={error} onRetry={reload} title="We couldn’t load your budgets" />
      </div>
    );
  }

  const { overall, categories: categoryBudgets, totalSpent, totalBudgeted } = data;

  return (
    <div className="page-stack">
      {header}

      <section className={cx('overall-budget', !overall && 'overall-budget--empty')}>
        {overall ? (
          <>
            <div className="overall-budget__ring">
              <ProgressRing
                value={overall.percent}
                size={148}
                stroke={11}
                tone={PROGRESS_TONE[overall.status] || 'accent'}
                ariaLabel={`${formatPercent(overall.percent)} of overall budget used`}
              >
                <span className="overall-budget__percent">{formatPercent(overall.percent)}</span>
                <span className="overall-budget__used-label">used</span>
              </ProgressRing>
            </div>

            <div className="overall-budget__body">
              <div className="overall-budget__top">
                <div>
                  <p className="overall-budget__eyebrow">{monthLabel} · overall budget</p>
                  <h2 className="overall-budget__title">
                    {formatCurrency(overall.spent, currency)}
                    <span> of {formatCurrency(overall.amount, currency)}</span>
                  </h2>
                </div>
                <Badge tone={BUDGET_STATUS_TONE[overall.status]} dot>
                  {BUDGET_STATUS_LABEL[overall.status]}
                </Badge>
              </div>

              <ProgressBar
                value={overall.percent}
                tone={PROGRESS_TONE[overall.status] || 'accent'}
                className="overall-budget__bar"
                label="Overall budget used"
              />

              <div className="overall-budget__footer">
                <p className={cx('overall-budget__message', overall.percent >= 75 && 'is-alert')}>
                  {overall.percent >= 75 && <AlertTriangle size={15} strokeWidth={2.2} aria-hidden="true" />}
                  {overall.message}
                </p>
                <div className="overall-budget__actions">
                  <Button variant="secondary" size="sm" icon={Pencil} onClick={openOverall}>
                    Edit budget
                  </Button>
                  <IconButton
                    label="Remove overall budget"
                    icon={Trash2}
                    size="sm"
                    className="icon-button--danger"
                    onClick={() => setPendingDelete({ ...overall, label: 'overall budget' })}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="overall-budget__empty">
            <span className="overall-budget__empty-icon" aria-hidden="true">
              <Gauge size={24} strokeWidth={1.9} />
            </span>
            <div>
              <h2 className="overall-budget__empty-title">Set an overall budget for {monthLabel}</h2>
              <p className="overall-budget__empty-text">
                One number keeps the whole month honest. Category budgets can come later.
              </p>
            </div>
            <Button icon={Plus} onClick={openOverall}>Set overall budget</Button>
          </div>
        )}
      </section>

      <section className="panel panel--flush">
        <div className="panel__pad">
          <SectionHeader
            title="Category budgets"
            description={`${formatCurrency(totalSpent, currency, { whole: true })} spent across ${categoryBudgets.length} ${categoryBudgets.length === 1 ? 'category budget' : 'category budgets'}${totalBudgeted ? ` · ${formatCurrency(totalBudgeted, currency, { whole: true })} budgeted` : ''}.`}
            action={<Button variant="soft" size="sm" icon={Plus} onClick={openNewCategory}>Add</Button>}
          />
        </div>

        {categoryBudgets.length > 0 ? (
          <div className="panel__pad budget-grid">
            {categoryBudgets.map((budget) => (
              <CategoryBudgetCard
                key={budget._id}
                budget={budget}
                currency={currency}
                onEdit={() => openCategory(budget)}
                onDelete={() => setPendingDelete({ ...budget, label: `${budget.category?.name} budget` })}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Wallet}
            title="No category budgets yet"
            description="Give the categories you care about their own monthly limits — food, travel, subscriptions."
            action={expenseCategories.length > 0
              ? <Button variant="secondary" size="sm" icon={Plus} onClick={openNewCategory}>Add a category budget</Button>
              : <LinkButton to="/settings" size="sm">Create a category first</LinkButton>}
          />
        )}
      </section>

      <BudgetFormModal
        open={Boolean(editor)}
        onClose={() => setEditor(null)}
        onSaved={reload}
        month={month}
        monthLabel={monthLabel}
        scope={editor?.scope || 'overall'}
        budget={editor?.budget || null}
        categories={expenseCategories}
        existingCategoryIds={existingCategoryIds}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Remove this budget?"
        description={pendingDelete
          ? `The ${pendingDelete.label} for ${monthLabel} will be deleted. Your transactions stay untouched.`
          : ''}
        confirmLabel="Remove budget"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}
