import { useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Flag,
  Pencil,
  PiggyBank,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button, IconButton } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/Progress';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton } from '../components/ui/Skeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { GoalFormModal } from '../components/goals/GoalFormModal';
import { ContributeModal } from '../components/goals/ContributeModal';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import { useResource } from '../hooks/useResource';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { api } from '../api/client';
import {
  formatCurrency,
  formatDate,
  formatPercent,
  pluralize,
} from '../lib/format';
import { cx } from '../lib/cx';

function goalTiming(goal) {
  if (goal.status === 'achieved') return { tone: 'success', label: 'Achieved' };
  if (goal.status === 'overdue') return { tone: 'danger', label: 'Overdue' };
  if (goal.daysLeft === 0) return { tone: 'warning', label: 'Due today' };
  return { tone: 'neutral', label: `${pluralize(goal.daysLeft, 'day')} left` };
}

function GoalCard({ goal, currency, onContribute, onEdit, onDelete }) {
  const timing = goalTiming(goal);
  const monthlyPace = goal.daysLeft > 0 && goal.remaining > 0
    ? goal.remaining / Math.max(1, goal.daysLeft / 30)
    : 0;

  return (
    <article
      className={cx('goal-card', goal.status === 'achieved' && 'goal-card--achieved')}
      style={{ '--goal-color': goal.color }}
    >
      <div className="goal-card__header">
        <span className="goal-card__icon" aria-hidden="true">
          {goal.status === 'achieved'
            ? <CheckCircle2 size={19} strokeWidth={2} />
            : <Flag size={19} strokeWidth={2} />}
        </span>
        <div className="goal-card__title-group">
          <h2 className="goal-card__title">{goal.name}</h2>
          <p className="goal-card__date">
            <CalendarClock size={13} strokeWidth={2} aria-hidden="true" />
            {formatDate(goal.targetDate, 'medium')}
          </p>
        </div>
        <div className="goal-card__actions">
          <IconButton label={`Edit ${goal.name}`} icon={Pencil} size="sm" onClick={onEdit} />
          <IconButton
            label={`Delete ${goal.name}`}
            icon={Trash2}
            size="sm"
            className="icon-button--danger"
            onClick={onDelete}
          />
        </div>
      </div>

      <div className="goal-card__figures">
        <span className="goal-card__saved">{formatCurrency(goal.currentAmount, currency)}</span>
        <span className="goal-card__target">of {formatCurrency(goal.targetAmount, currency)}</span>
        <Badge tone={goal.status === 'achieved' ? 'success' : timing.tone} size="sm">
          {goal.status === 'achieved' ? 'Goal reached' : timing.label}
        </Badge>
      </div>

      <ProgressBar
        value={goal.progressPercent}
        tone={goal.status === 'achieved' ? 'success' : goal.status === 'overdue' ? 'danger' : 'accent'}
        className="goal-card__progress"
        label={`${goal.name} progress`}
      />

      <div className="goal-card__footer">
        <span className="goal-card__percent">
          {formatPercent(goal.percent, goal.percent % 1 === 0 ? 0 : 1)}
        </span>
        {goal.status === 'achieved' ? (
          <span className="goal-card__done">
            <Sparkles size={14} strokeWidth={2} aria-hidden="true" />
            Nicely done
          </span>
        ) : (
          <span className="goal-card__pace">
            {formatCurrency(Math.max(0, goal.remaining), currency, { whole: true })} to go
            {monthlyPace > 0 && ` · ~${formatCurrency(monthlyPace, currency, { whole: true })}/mo`}
          </span>
        )}
      </div>

      <Button
        variant={goal.status === 'achieved' ? 'soft' : 'secondary'}
        size="sm"
        fullWidth
        onClick={onContribute}
      >
        {goal.status === 'achieved' ? 'Add a little extra' : 'Add money'}
      </Button>
    </article>
  );
}

export default function GoalsPage() {
  useDocumentTitle('Savings goals');

  const { user } = useAuth();
  const { version } = useAppData();
  const toast = useToast();
  const [formGoal, setFormGoal] = useState(undefined);
  const [contributeGoal, setContributeGoal] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const currency = user?.currency || 'USD';
  const { data, loading, error, reload } = useResource(
    () => api('/goals'),
    [version],
  );

  const goals = data?.items || [];
  const totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const achieved = goals.filter((goal) => goal.status === 'achieved').length;
  const active = goals.length - achieved;

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api(`/goals/${pendingDelete._id}`, { method: 'DELETE' });
      toast.success('Goal removed', 'You can always start a new one.');
      setPendingDelete(null);
      await reload();
    } catch (deleteError) {
      toast.error('Could not delete goal', deleteError.message);
    } finally {
      setDeleting(false);
    }
  };

  const header = (
    <PageHeader
      eyebrow="Plan"
      title="Savings goals"
      description="Give your savings a purpose. Watch the small contributions turn into something real."
      actions={<Button icon={Plus} onClick={() => setFormGoal(null)}>New goal</Button>}
    />
  );

  if (loading && !data) {
    return (
      <div className="page-stack">
        {header}
        <Skeleton height={110} radius={24} />
        <div className="goals-grid">
          {Array.from({ length: 3 }, (_item, index) => (
            <Skeleton key={index} height={250} radius={24} />
          ))}
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="page-stack">
        {header}
        <ErrorState error={error} onRetry={reload} title="We couldn’t load your goals" />
      </div>
    );
  }

  return (
    <div className="page-stack">
      {header}

      {goals.length > 0 && (
        <div className="goals-summary">
          <div className="goals-summary__item">
            <span className="goals-summary__label">Total saved</span>
            <span className="goals-summary__value">{formatCurrency(totalSaved, currency)}</span>
          </div>
          <div className="goals-summary__divider" aria-hidden="true" />
          <div className="goals-summary__item">
            <span className="goals-summary__label">In progress</span>
            <span className="goals-summary__value">{active}</span>
          </div>
          <div className="goals-summary__divider" aria-hidden="true" />
          <div className="goals-summary__item">
            <span className="goals-summary__label">Achieved</span>
            <span className="goals-summary__value goals-summary__value--success">{achieved}</span>
          </div>
          <div className="goals-summary__note">
            <PiggyBank size={17} strokeWidth={2} aria-hidden="true" />
            Every deposit counts — no amount is too small.
          </div>
        </div>
      )}

      {goals.length === 0 ? (
        <section className="panel">
          <EmptyState
            icon={PiggyBank}
            title="What are you saving for?"
            description="A trip, a cushion, a new laptop — give it a name and a target, and Moneta will keep score."
            action={<Button size="sm" icon={Plus} onClick={() => setFormGoal(null)}>Create your first goal</Button>}
          />
        </section>
      ) : (
        <div className="goals-grid">
          {goals.map((goal) => (
            <GoalCard
              key={goal._id}
              goal={goal}
              currency={currency}
              onContribute={() => setContributeGoal(goal)}
              onEdit={() => setFormGoal(goal)}
              onDelete={() => setPendingDelete(goal)}
            />
          ))}
        </div>
      )}

      <GoalFormModal
        open={formGoal !== undefined}
        onClose={() => setFormGoal(undefined)}
        onSaved={reload}
        goal={formGoal || null}
      />

      <ContributeModal
        open={Boolean(contributeGoal)}
        onClose={() => setContributeGoal(null)}
        onSaved={reload}
        goal={contributeGoal}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this goal?"
        description={pendingDelete
          ? `“${pendingDelete.name}” and its progress will be removed. Your transactions are not affected.`
          : ''}
        confirmLabel="Delete goal"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}
