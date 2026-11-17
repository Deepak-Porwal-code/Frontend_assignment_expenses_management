import { useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  Landmark,
  Pencil,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button, IconButton } from '../components/ui/Button';
import { AccountIcon } from '../components/ui/Icon';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton } from '../components/ui/Skeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { AccountFormModal } from '../components/accounts/AccountFormModal';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import { useResource } from '../hooks/useResource';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { api } from '../api/client';
import { getAccountType } from '../lib/constants';
import { formatCurrency, pluralize } from '../lib/format';
import { cx } from '../lib/cx';

function AccountCard({ account, currency, onEdit, onArchive, onDelete, busy }) {
  const type = getAccountType(account.type);

  return (
    <article
      className={cx('account-card', account.isArchived && 'account-card--archived')}
      style={{ '--account-color': account.color || type.color }}
    >
      <div className="account-card__header">
        <AccountIcon type={account.type} />
        <div className="account-card__identity">
          <h2 className="account-card__name">{account.name}</h2>
          <p className="account-card__type">{type.label}</p>
        </div>
        <div className="account-card__actions">
          <IconButton label={`Edit ${account.name}`} icon={Pencil} size="sm" onClick={onEdit} />
          <IconButton
            label={account.isArchived ? `Restore ${account.name}` : `Archive ${account.name}`}
            icon={account.isArchived ? ArchiveRestore : Archive}
            size="sm"
            onClick={onArchive}
            disabled={busy}
          />
          <IconButton
            label={`Delete ${account.name}`}
            icon={Trash2}
            size="sm"
            className="icon-button--danger"
            onClick={onDelete}
          />
        </div>
      </div>

      <div className="account-card__balance">
        <p className="account-card__balance-label">Current balance</p>
        <p className={cx('account-card__balance-value', account.balance < 0 && 'is-negative')}>
          {formatCurrency(account.balance, currency)}
        </p>
      </div>

      <div className="account-card__figures">
        <span className="account-card__figure">
          <TrendingUp size={14} strokeWidth={2.1} aria-hidden="true" />
          <span>In</span>
          <strong>{formatCurrency(account.income, currency, { whole: true })}</strong>
        </span>
        <span className="account-card__figure account-card__figure--expense">
          <TrendingDown size={14} strokeWidth={2.1} aria-hidden="true" />
          <span>Out</span>
          <strong>{formatCurrency(account.expense, currency, { whole: true })}</strong>
        </span>
      </div>

      {account.isArchived && (
        <Badge tone="neutral" size="sm" className="account-card__badge">Archived</Badge>
      )}
    </article>
  );
}

export default function AccountsPage() {
  useDocumentTitle('Accounts');

  const { user } = useAuth();
  const { version, refresh } = useAppData();
  const toast = useToast();
  const [formAccount, setFormAccount] = useState(undefined);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const currency = user?.currency || 'USD';
  const { data, loading, error, reload } = useResource(
    () => api('/accounts?includeArchived=true'),
    [version],
  );

  const accounts = data?.items || [];
  const activeAccounts = accounts.filter((account) => !account.isArchived);
  const archivedAccounts = accounts.filter((account) => account.isArchived);
  const totalBalance = activeAccounts.reduce((sum, account) => sum + account.balance, 0);

  const sync = async () => {
    await refresh();
    await reload();
  };

  const handleArchive = async (account) => {
    setBusyId(account._id);
    try {
      await api(`/accounts/${account._id}`, {
        method: 'PATCH',
        body: { isArchived: !account.isArchived },
      });
      toast.success(
        account.isArchived ? 'Account restored' : 'Account archived',
        account.isArchived
          ? 'It can be used for new transactions again.'
          : 'Your history stays intact — it just leaves the active list.',
      );
      await sync();
    } catch (archiveError) {
      toast.error('Could not update account', archiveError.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api(`/accounts/${pendingDelete._id}`, { method: 'DELETE' });
      toast.success('Account deleted', 'It’s gone for good.');
      setPendingDelete(null);
      await sync();
    } catch (deleteError) {
      toast.error('Could not delete account', deleteError.message);
    } finally {
      setDeleting(false);
    }
  };

  const header = (
    <PageHeader
      eyebrow="Manage"
      title="Accounts"
      description="See each balance on its own, then add them up for the full picture."
      actions={<Button icon={Plus} onClick={() => setFormAccount(null)}>Add account</Button>}
    />
  );

  if (loading && !data) {
    return (
      <div className="page-stack">
        {header}
        <Skeleton height={150} radius={26} />
        <div className="accounts-grid">
          {Array.from({ length: 4 }, (_item, index) => (
            <Skeleton key={index} height={210} radius={24} />
          ))}
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="page-stack">
        {header}
        <ErrorState error={error} onRetry={reload} title="We couldn’t load your accounts" />
      </div>
    );
  }

  return (
    <div className="page-stack">
      {header}

      <section className="accounts-hero" aria-label="Combined balance">
        <div>
          <p className="accounts-hero__label">Combined balance</p>
          <p className="accounts-hero__value">{formatCurrency(totalBalance, currency)}</p>
          <p className="accounts-hero__meta">
            Across {pluralize(activeAccounts.length, 'active account')}
            {archivedAccounts.length > 0 && ` · ${archivedAccounts.length} archived`}
          </p>
        </div>
        <span className="accounts-hero__icon" aria-hidden="true">
          <Landmark size={26} strokeWidth={1.8} />
        </span>
      </section>

      {accounts.length === 0 ? (
        <section className="panel">
          <EmptyState
            icon={Landmark}
            title="No accounts yet"
            description="Add the places your money lives so every transaction has a home."
            action={<Button size="sm" icon={Plus} onClick={() => setFormAccount(null)}>Add your first account</Button>}
          />
        </section>
      ) : (
        <>
          <section aria-labelledby="active-accounts-heading">
            <div className="section-heading">
              <h2 id="active-accounts-heading" className="section-heading__title">Active accounts</h2>
              <span className="section-heading__count">{activeAccounts.length}</span>
            </div>
            <div className="accounts-grid">
              {activeAccounts.map((account) => (
                <AccountCard
                  key={account._id}
                  account={account}
                  currency={currency}
                  busy={busyId === account._id}
                  onEdit={() => setFormAccount(account)}
                  onArchive={() => handleArchive(account)}
                  onDelete={() => setPendingDelete(account)}
                />
              ))}
            </div>
          </section>

          {archivedAccounts.length > 0 && (
            <section aria-labelledby="archived-accounts-heading">
              <div className="section-heading">
                <h2 id="archived-accounts-heading" className="section-heading__title">Archived</h2>
                <span className="section-heading__count">{archivedAccounts.length}</span>
              </div>
              <div className="accounts-grid">
                {archivedAccounts.map((account) => (
                  <AccountCard
                    key={account._id}
                    account={account}
                    currency={currency}
                    busy={busyId === account._id}
                    onEdit={() => setFormAccount(account)}
                    onArchive={() => handleArchive(account)}
                    onDelete={() => setPendingDelete(account)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <AccountFormModal
        open={formAccount !== undefined}
        onClose={() => setFormAccount(undefined)}
        onSaved={sync}
        account={formAccount || null}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this account?"
        description={pendingDelete
          ? `“${pendingDelete.name}” can only be deleted when it has no transactions or recurring rules. Archive is often the safer option.`
          : ''}
        confirmLabel="Delete account"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}
