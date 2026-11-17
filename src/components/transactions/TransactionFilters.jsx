import { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Button } from '../ui/Button';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { TRANSACTION_TYPES } from '../../lib/constants';
import { formatCurrency, formatDateRange } from '../../lib/format';
import { cx } from '../../lib/cx';

const TYPE_OPTIONS = [
  { value: '', label: 'All' },
  ...TRANSACTION_TYPES.map((type) => ({
    value: type.value,
    label: type.value === 'expense' ? 'Expenses' : 'Income',
  })),
];

const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Newest first' },
  { value: 'date_asc', label: 'Oldest first' },
  { value: 'amount_desc', label: 'Amount: high to low' },
  { value: 'amount_asc', label: 'Amount: low to high' },
];

function FilterSelect({ label, value, onChange, icon: Icon, children }) {
  return (
    <div className={cx('filter-select', value && 'is-active')}>
      {Icon && <Icon size={15} strokeWidth={2} aria-hidden="true" />}
      <select aria-label={label} value={value} onChange={onChange}>
        {children}
      </select>
      <ChevronDown size={14} strokeWidth={2.2} aria-hidden="true" />
    </div>
  );
}

export function TransactionFilters({
  value,
  onChange,
  onClear,
  categories,
  accounts,
  currency,
}) {
  const [searchTerm, setSearchTerm] = useState(value.search);
  const debouncedSearch = useDebouncedValue(searchTerm, 320);
  const lastSearchRef = useRef(value.search);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [draft, setDraft] = useState({
    from: value.from,
    to: value.to,
    min: value.min,
    max: value.max,
  });
  const [advancedError, setAdvancedError] = useState('');

  // Keep the input in sync when filters are cleared from the outside.
  useEffect(() => {
    if (value.search === lastSearchRef.current) return;
    lastSearchRef.current = value.search;
    setSearchTerm(value.search);
  }, [value.search]);

  useEffect(() => {
    if (debouncedSearch === lastSearchRef.current) return;
    lastSearchRef.current = debouncedSearch;
    onChange({ search: debouncedSearch });
  }, [debouncedSearch, onChange]);

  useEffect(() => {
    if (!advancedOpen) return;
    setDraft({ from: value.from, to: value.to, min: value.min, max: value.max });
    setAdvancedError('');
  }, [advancedOpen, value.from, value.to, value.min, value.max]);

  const expenseCategories = categories.filter((category) => category.type === 'expense');
  const incomeCategories = categories.filter((category) => category.type === 'income');

  const activeChips = [];
  if (value.type) {
    activeChips.push({
      key: 'type',
      label: value.type === 'income' ? 'Income' : 'Expenses',
      clear: { type: '' },
    });
  }
  if (value.category) {
    const category = categories.find((item) => item._id === value.category);
    activeChips.push({
      key: 'category',
      label: category?.name || 'Category',
      clear: { category: '' },
    });
  }
  if (value.account) {
    const account = accounts.find((item) => item._id === value.account);
    activeChips.push({
      key: 'account',
      label: account?.name || 'Account',
      clear: { account: '' },
    });
  }
  if (value.from || value.to) {
    activeChips.push({
      key: 'dates',
      label: formatDateRange(value.from, value.to),
      clear: { from: '', to: '' },
    });
  }
  if (value.min || value.max) {
    const range = value.min && value.max
      ? `${formatCurrency(value.min, currency, { whole: true })} – ${formatCurrency(value.max, currency, { whole: true })}`
      : value.min
        ? `Over ${formatCurrency(value.min, currency, { whole: true })}`
        : `Under ${formatCurrency(value.max, currency, { whole: true })}`;
    activeChips.push({ key: 'amount', label: range, clear: { min: '', max: '' } });
  }
  if (value.search) {
    activeChips.push({
      key: 'search',
      label: `“${value.search}”`,
      clear: { search: '' },
    });
  }

  const advancedCount = [value.from, value.to, value.min, value.max].filter(Boolean).length;

  const applyAdvanced = () => {
    const from = draft.from;
    const to = draft.to;

    if (from && to && from > to) {
      setAdvancedError('The end date must be on or after the start date.');
      return;
    }
    if (draft.min !== '' && Number(draft.min) < 0) {
      setAdvancedError('The minimum amount can’t be negative.');
      return;
    }
    if (draft.max !== '' && Number(draft.max) < 0) {
      setAdvancedError('The maximum amount can’t be negative.');
      return;
    }
    if (draft.min !== '' && draft.max !== '' && Number(draft.min) > Number(draft.max)) {
      setAdvancedError('The maximum amount must be greater than the minimum.');
      return;
    }

    setAdvancedError('');
    setAdvancedOpen(false);
    onChange({ from, to, min: draft.min, max: draft.max });
  };

  return (
    <section className="filters" aria-label="Filter transactions">
      <div className="filters__row">
        <div className="filters__search">
          <Search size={16} strokeWidth={2} aria-hidden="true" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search notes, categories or amounts"
            aria-label="Search transactions"
          />
          {searchTerm && (
            <button
              type="button"
              className="filters__search-clear"
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
            >
              <X size={14} strokeWidth={2.2} />
            </button>
          )}
        </div>

        <SegmentedControl
          options={TYPE_OPTIONS}
          value={value.type}
          onChange={(type) => onChange({ type })}
          label="Filter by type"
          size="sm"
          className="filters__type"
        />

        <FilterSelect
          label="Filter by category"
          value={value.category}
          onChange={(event) => onChange({ category: event.target.value })}
        >
          <option value="">All categories</option>
          {expenseCategories.length > 0 && (
            <optgroup label="Expense">
              {expenseCategories.map((category) => (
                <option key={category._id} value={category._id}>{category.name}</option>
              ))}
            </optgroup>
          )}
          {incomeCategories.length > 0 && (
            <optgroup label="Income">
              {incomeCategories.map((category) => (
                <option key={category._id} value={category._id}>{category.name}</option>
              ))}
            </optgroup>
          )}
        </FilterSelect>

        <FilterSelect
          label="Filter by account"
          value={value.account}
          onChange={(event) => onChange({ account: event.target.value })}
        >
          <option value="">All accounts</option>
          {accounts.filter((account) => !account.isArchived).map((account) => (
            <option key={account._id} value={account._id}>{account.name}</option>
          ))}
        </FilterSelect>

        <Button
          variant={advancedCount ? 'soft' : 'secondary'}
          size="sm"
          icon={SlidersHorizontal}
          onClick={() => setAdvancedOpen((previous) => !previous)}
          aria-expanded={advancedOpen}
          className="filters__advanced-toggle"
        >
          Filters{advancedCount ? ` · ${advancedCount}` : ''}
        </Button>
      </div>

      {advancedOpen && (
        <div className="filters__advanced">
          <div className="filters__advanced-grid">
            <label className="filters__field">
              <span>From</span>
              <input
                type="date"
                value={draft.from}
                onChange={(event) => setDraft((previous) => ({ ...previous, from: event.target.value }))}
              />
            </label>
            <label className="filters__field">
              <span>To</span>
              <input
                type="date"
                value={draft.to}
                onChange={(event) => setDraft((previous) => ({ ...previous, to: event.target.value }))}
              />
            </label>
            <label className="filters__field">
              <span>Min amount</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0"
                value={draft.min}
                onChange={(event) => setDraft((previous) => ({ ...previous, min: event.target.value }))}
              />
            </label>
            <label className="filters__field">
              <span>Max amount</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="Any"
                value={draft.max}
                onChange={(event) => setDraft((previous) => ({ ...previous, max: event.target.value }))}
              />
            </label>
          </div>

          {advancedError && <p className="filters__error" role="alert">{advancedError}</p>}

          <div className="filters__advanced-actions">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDraft({ from: '', to: '', min: '', max: '' });
                setAdvancedError('');
              }}
            >
              Reset
            </Button>
            <Button size="sm" onClick={applyAdvanced}>Apply filters</Button>
          </div>
        </div>
      )}

      <div className="filters__bottom">
        <FilterSelect
          label="Sort transactions"
          value={value.sort}
          onChange={(event) => onChange({ sort: event.target.value })}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </FilterSelect>

        {activeChips.length > 0 && (
          <div className="filter-chips" aria-label="Active filters">
            {activeChips.map((chip) => (
              <button
                type="button"
                key={chip.key}
                className="filter-chip"
                onClick={() => onChange(chip.clear)}
                aria-label={`Remove filter ${chip.label}`}
              >
                <span>{chip.label}</span>
                <X size={12} strokeWidth={2.5} aria-hidden="true" />
              </button>
            ))}
            <button type="button" className="filter-chips__clear" onClick={onClear}>
              Clear all
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
