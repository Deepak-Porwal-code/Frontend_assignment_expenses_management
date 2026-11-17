import { useState } from 'react';
import {
  CalendarClock,
  Pencil,
  Plus,
  Repeat2,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button, IconButton } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Switch } from '../components/ui/Switch';
import { CategoryIcon } from '../components/ui/Icon';
import { Amount } from '../components/ui/Amount';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton } from '../components/ui/Skeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { RecurringFormModal } from '../components/recurring/RecurringFormModal';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import { useResource } from '../hooks/useResource';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { api } from '../api/client';
import { FREQUENCY_LABELS } from '../lib/constants';
import { formatDate, pluralize } from '../lib/format';

function RuleRow({ rule, currency, onEdit, onDelete, onToggle, toggling }) {
  return (
    <li className="rule-row">
      <CategoryIcon category={rule.category} />

      <div className="rule-row__body">
        <p className="rule-row__title">
          {rule.note || rule.category?.name || 'Recurring transaction'}
        </p>
        <p className="rule-row__meta">
          <Badge tone={rule.isActive ? 'accent' : 'neutral'} size="sm">
            {FREQUENCY_LABELS[rule.frequency]}
          </Badge>
          <span>{rule.category?.name || 'Uncategorized'}</span>
          <span aria-hidden="true">·</span>
          <span>{rule.account?.name || 'Account'}</span>
        </p>
        <p className="rule-row__next">
          <CalendarClock size={13} strokeWidth={2} aria-hidden="true" />
          {rule.isActive
            ? `Next on ${formatDate(rule.nextRun, 'medium')}`
            : 'Paused — no new transactions'}
          {rule.lastRun && (
            <span className="rule-row__last">· Last {formatDate(rule.lastRun, 'short')}</span>
          )}
        </p>
      </div>

      <div className="rule-row__amount">
        <Amount value={rule.amount} type={rule.type} currency={currency} />
      </div>

      <div className="rule-row__controls">
        <Switch
          checked={rule.isActive}
          onChange={(value) => onToggle(rule, value)}
          disabled={toggling}
          ariaLabel={`${rule.isActive ? 'Pause' : 'Resume'} ${rule.note || rule.category?.name || 'rule'}`}
        />
        <IconButton label="Edit rule" icon={Pencil} size="sm" onClick={onEdit} />
        <IconButton
          label="Delete rule"
          icon={Trash2}
          size="sm"
          className="icon-button--danger"
          onClick={onDelete}
        />
      </div>
    </li>
  );
}

export default function RecurringPage() {
  useDocumentTitle('Recurring');

  const { user } = useAuth();
  const { version, refresh } = useAppData();
  const toast = useToast();
  const [formRule, setFormRule] = useState(undefined);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const currency = user?.currency || 'USD';
  const { data, loading, error, reload } = useResource(
    () => api('/recurring'),
    [version],
  );

  const rules = data?.items || [];
  const activeRules = rules.filter((rule) => rule.isActive);
  const pausedRules = rules.filter((rule) => !rule.isActive);

  const sync = async () => {
    await refresh();
    await reload();
  };

  const handleToggle = async (rule, isActive) => {
    setTogglingId(rule._id);
    try {
      await api(`/recurring/${rule._id}`, {
        method: 'PATCH',
        body: { isActive },
      });
      toast.info(
        isActive ? 'Rule resumed' : 'Rule paused',
        isActive ? 'Due entries will be created again.' : 'Existing transactions stay right where they are.',
      );
      await sync();
    } catch (toggleError) {
      toast.error('Could not update rule', toggleError.message);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api(`/recurring/${pendingDelete._id}`, { method: 'DELETE' });
      toast.success('Rule deleted', 'No future transactions will be created.');
      setPendingDelete(null);
      await reload();
    } catch (deleteError) {
      toast.error('Could not delete rule', deleteError.message);
    } finally {
      setDeleting(false);
    }
  };

  const header = (
    <PageHeader
      eyebrow="Plan"
      title="Recurring"
      description="Rent, salary, subscriptions — set the rhythm once and let Moneta keep time."
      actions={<Button icon={Plus} onClick={() => setFormRule(null)}>New rule</Button>}
    />
  );

  if (loading && !data) {
    return (
      <div className="page-stack">
        {header}
        <Skeleton height={88} radius={20} />
        <div className="panel">
          {Array.from({ length: 4 }, (_item, index) => (
            <Skeleton key={index} height={72} radius={16} className="skeleton-row" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="page-stack">
        {header}
        <ErrorState error={error} onRetry={reload} title="We couldn’t load recurring rules" />
      </div>
    );
  }

  return (
    <div className="page-stack">
      {header}

      <div className="info-banner">
        <span className="info-banner__icon" aria-hidden="true">
          <Repeat2 size={18} strokeWidth={2} />
        </span>
        <div>
          <p className="info-banner__title">Runs on its own</p>
          <p className="info-banner__text">
            Due transactions are created automatically when you sign in and through hourly checks.
            Pausing a rule never deletes its history.
          </p>
        </div>
      </div>

      {rules.length === 0 ? (
        <section className="panel">
          <EmptyState
            icon={Repeat2}
            title="No recurring transactions yet"
            description="Add the things that happen every week, month or year and stop entering them by hand."
            action={<Button size="sm" icon={Plus} onClick={() => setFormRule(null)}>Create a rule</Button>}
          />
        </section>
      ) : (
        <>
          <section className="panel panel--flush">
            <div className="panel__pad">
              <div className="section-header">
                <div>
                  <h2 className="section-header__title">Active</h2>
                  <p className="section-header__description">
                    {pluralize(activeRules.length, 'rule')} creating transactions on schedule.
                  </p>
                </div>
              </div>
            </div>
            {activeRules.length > 0 ? (
              <ul className="rule-list">
                {activeRules.map((rule) => (
                  <RuleRow
                    key={rule._id}
                    rule={rule}
                    currency={currency}
                    toggling={togglingId === rule._id}
                    onEdit={() => setFormRule(rule)}
                    onDelete={() => setPendingDelete(rule)}
                    onToggle={handleToggle}
                  />
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={Repeat2}
                title="Everything is paused"
                description="Resume a rule below whenever you’re ready."
                compact
              />
            )}
          </section>

          {pausedRules.length > 0 && (
            <section className="panel panel--flush">
              <div className="panel__pad">
                <h2 className="section-header__title">Paused</h2>
                <p className="section-header__description">
                  Keep the rule for later — it won’t create anything until resumed.
                </p>
              </div>
              <ul className="rule-list">
                {pausedRules.map((rule) => (
                  <RuleRow
                    key={rule._id}
                    rule={rule}
                    currency={currency}
                    toggling={togglingId === rule._id}
                    onEdit={() => setFormRule(rule)}
                    onDelete={() => setPendingDelete(rule)}
                    onToggle={handleToggle}
                  />
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <RecurringFormModal
        open={formRule !== undefined}
        onClose={() => setFormRule(undefined)}
        onSaved={sync}
        rule={formRule || null}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this recurring rule?"
        description={pendingDelete
          ? `No more entries will be created for “${pendingDelete.note || pendingDelete.category?.name}”. Transactions it already created are kept.`
          : ''}
        confirmLabel="Delete rule"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}
