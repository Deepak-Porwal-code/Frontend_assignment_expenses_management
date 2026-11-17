import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  SearchX,
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton, ListSkeleton } from '../components/ui/Skeleton';
import { Amount } from '../components/ui/Amount';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { TransactionFilters } from '../components/transactions/TransactionFilters';
import { TransactionTable } from '../components/transactions/TransactionTable';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useUI } from '../context/UIContext';
import { useToast } from '../context/ToastContext';
import { useResource } from '../hooks/useResource';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { api, buildQuery, downloadTransactionsCsv, openAttachment } from '../api/client';
import { formatCurrency } from '../lib/format';
import { cx } from '../lib/cx';

const DEFAULT_FILTERS = {
  page: 1,
  limit: 10,
  type: '',
  category: '',
  account: '',
  from: '',
  to: '',
  min: '',
  max: '',
  search: '',
  sort: 'date_desc',
};

const PARAM_KEYS = ['type', 'category', 'account', 'from', 'to', 'search'];

function initialFilters(searchParams) {
  const filters = { ...DEFAULT_FILTERS };
  PARAM_KEYS.forEach((key) => {
    const value = searchParams.get(key);
    if (value) filters[key] = value;
  });
  return filters;
}

function hasActiveFilters(filters) {
  return ['type', 'category', 'account', 'from', 'to', 'min', 'max', 'search']
    .some((key) => filters[key]);
}

export default function TransactionsPage() {
  useDocumentTitle('Transactions');

  const { user } = useAuth();
  const { accounts, categories, version, refresh } = useAppData();
  const { openTransactionModal } = useUI();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const [filters, setFilters] = useState(() => initialFilters(searchParams));
  const [exporting, setExporting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const paramsRef = useRef(searchParams.toString());

  const currency = user?.currency || 'USD';
  const query = buildQuery(filters);
  const { data, loading, error, reload } = useResource(
    () => api(`/transactions${query}`),
    [filters, version],
  );

  // Let links from Analytics open this page pre-filtered.
  useEffect(() => {
    const signature = searchParams.toString();
    if (signature === paramsRef.current) return;
    paramsRef.current = signature;

    const incoming = {};
    PARAM_KEYS.forEach((key) => {
      const value = searchParams.get(key);
      if (value) incoming[key] = value;
    });
    setFilters((previous) => ({ ...previous, ...incoming, page: 1 }));
  }, [searchParams]);

  const updateFilters = useCallback((patch) => {
    setFilters((previous) => ({
      ...previous,
      ...patch,
      page: Object.prototype.hasOwnProperty.call(patch, 'page') ? patch.page : 1,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters((previous) => ({
      ...DEFAULT_FILTERS,
      limit: previous.limit,
      sort: previous.sort,
    }));
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const filename = await downloadTransactionsCsv(filters);
      toast.success('CSV ready', `${filename} is downloading.`);
    } catch (exportError) {
      toast.error('Export failed', exportError.message);
    } finally {
      setExporting(false);
    }
  };

  const handleAttachment = async (transaction) => {
    try {
      await openAttachment(transaction._id);
    } catch (attachmentError) {
      toast.error('Could not open attachment', attachmentError.message);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api(`/transactions/${pendingDelete._id}`, { method: 'DELETE' });
      toast.success('Transaction deleted', 'Your balances have been updated.');
      setPendingDelete(null);
      await refresh();
    } catch (deleteError) {
      toast.error('Could not delete transaction', deleteError.message);
    } finally {
      setDeleting(false);
    }
  };

  const transactions = data?.items || [];
  const pagination = data?.pagination;
  const summary = data?.summary || { income: 0, expense: 0, net: 0 };
  const active = hasActiveFilters(filters);
  const rangeStart = pagination && pagination.total > 0
    ? (pagination.page - 1) * pagination.limit + 1
    : 0;
  const rangeEnd = pagination
    ? Math.min(pagination.page * pagination.limit, pagination.total)
    : 0;

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="History"
        title="Transactions"
        description="Every movement, in one calm place. Filter, search and export whenever you need."
        actions={(
          <>
            <Button
              variant="secondary"
              icon={Download}
              loading={exporting}
              onClick={handleExport}
            >
              Export CSV
            </Button>
            <Button icon={Plus} onClick={() => openTransactionModal()}>
              Add transaction
            </Button>
          </>
        )}
      />

      <TransactionFilters
        value={filters}
        onChange={updateFilters}
        onClear={clearFilters}
        categories={categories}
        accounts={accounts}
        currency={currency}
      />

      <section className="panel panel--flush" aria-live="polite" aria-busy={loading}>
        <div className="tx-summary">
          <div className="tx-summary__count">
            <p className="tx-summary__label">Results</p>
            <p className="tx-summary__value">
              {pagination ? `${pagination.total} ${pagination.total === 1 ? 'transaction' : 'transactions'}` : '—'}
            </p>
          </div>
          <div className="tx-summary__figures">
            <span className="tx-summary__figure">
              <span className="tx-summary__label">Income</span>
              <Amount value={summary.income} type="income" currency={currency} size="sm" />
            </span>
            <span className="tx-summary__figure">
              <span className="tx-summary__label">Expenses</span>
              <Amount value={summary.expense} type="expense" currency={currency} size="sm" />
            </span>
            <span className="tx-summary__figure tx-summary__figure--net">
              <span className="tx-summary__label">Net</span>
              <span className={cx('tx-summary__net', summary.net < 0 && 'is-negative')}>
                {formatCurrency(summary.net, currency)}
              </span>
            </span>
          </div>
        </div>

        {loading && !data && (
          <div className="panel__pad">
            <Skeleton width="30%" height={14} />
            <ListSkeleton rows={6} />
          </div>
        )}

        {error && !data && (
          <div className="panel__pad">
            <ErrorState error={error} onRetry={reload} title="We couldn’t load your transactions" />
          </div>
        )}

        {data && transactions.length === 0 && (
          <EmptyState
            icon={active ? SearchX : ArrowLeftRight}
            title={active ? 'No transactions match those filters' : 'No transactions yet'}
            description={active
              ? 'Try widening the dates, clearing the search or removing a filter.'
              : 'Add your first transaction and your history will start here.'}
            action={active
              ? <Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button>
              : <Button size="sm" icon={Plus} onClick={() => openTransactionModal()}>Add transaction</Button>}
          />
        )}

        {data && transactions.length > 0 && (
          <div className={cx('tx-results', loading && 'is-refreshing')}>
            <TransactionTable
              transactions={transactions}
              currency={currency}
              onEdit={(transaction) => openTransactionModal(transaction)}
              onDelete={(transaction) => setPendingDelete(transaction)}
              onAttachment={handleAttachment}
            />

            {pagination && pagination.total > 0 && (
              <footer className="pagination">
                <p className="pagination__summary">
                  Showing {rangeStart}–{rangeEnd} of {pagination.total}
                </p>
                <div className="pagination__controls">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={ChevronLeft}
                    disabled={!pagination.hasPrev}
                    onClick={() => updateFilters({ page: pagination.page - 1 })}
                  >
                    Previous
                  </Button>
                  <span className="pagination__page">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    iconRight={ChevronRight}
                    disabled={!pagination.hasNext}
                    onClick={() => updateFilters({ page: pagination.page + 1 })}
                  >
                    Next
                  </Button>
                </div>
              </footer>
            )}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this transaction?"
        description={pendingDelete
          ? `“${pendingDelete.note || pendingDelete.category?.name || 'This transaction'}” will be permanently removed and your balances will update.`
          : ''}
        confirmLabel="Delete transaction"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}
