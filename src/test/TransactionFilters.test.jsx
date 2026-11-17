import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TransactionFilters } from '../components/transactions/TransactionFilters';

const CATEGORIES = [
  { _id: 'category-1', name: 'Groceries', type: 'expense' },
  { _id: 'category-2', name: 'Salary', type: 'income' },
];

const ACCOUNTS = [
  { _id: 'account-1', name: 'Everyday', isArchived: false },
  { _id: 'account-2', name: 'Old account', isArchived: true },
];

const EMPTY_FILTERS = {
  search: '',
  type: '',
  category: '',
  account: '',
  from: '',
  to: '',
  min: '',
  max: '',
  sort: 'date_desc',
};

function renderFilters(overrides = {}) {
  const value = { ...EMPTY_FILTERS, ...overrides };
  const onChange = vi.fn();
  const onClear = vi.fn();

  render(
    <TransactionFilters
      value={value}
      onChange={onChange}
      onClear={onClear}
      categories={CATEGORIES}
      accounts={ACCOUNTS}
      currency="USD"
    />,
  );

  return { onChange, onClear, value };
}

describe('TransactionFilters', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('offers categories grouped by type and hides archived accounts', () => {
    renderFilters();

    const categorySelect = screen.getByLabelText('Filter by category');
    expect(within(categorySelect).getByRole('option', { name: 'Groceries' })).toBeInTheDocument();
    expect(within(categorySelect).getByRole('option', { name: 'Salary' })).toBeInTheDocument();

    const accountSelect = screen.getByLabelText('Filter by account');
    expect(within(accountSelect).getByRole('option', { name: 'Everyday' })).toBeInTheDocument();
    expect(within(accountSelect).queryByRole('option', { name: 'Old account' })).not.toBeInTheDocument();
  });

  it('emits type, category and sort changes', async () => {
    const user = userEvent.setup();
    const { onChange } = renderFilters();

    await user.click(screen.getByRole('button', { name: 'Expenses' }));
    expect(onChange).toHaveBeenCalledWith({ type: 'expense' });

    await user.selectOptions(screen.getByLabelText('Filter by category'), 'category-1');
    expect(onChange).toHaveBeenCalledWith({ category: 'category-1' });

    await user.selectOptions(screen.getByLabelText('Sort transactions'), 'amount_desc');
    expect(onChange).toHaveBeenCalledWith({ sort: 'amount_desc' });
  });

  it('debounces search input before querying', () => {
    vi.useFakeTimers();
    const { onChange } = renderFilters();
    const searchInput = screen.getByLabelText('Search transactions');

    fireEvent.change(searchInput, { target: { value: 'coffee' } });

    expect(onChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(onChange).toHaveBeenCalledWith({ search: 'coffee' });
  });

  it('rejects an invalid date range in the advanced panel', async () => {
    const user = userEvent.setup();
    const { onChange } = renderFilters();

    await user.click(screen.getByRole('button', { name: /^Filters/ }));

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-11-20' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-11-01' } });
    await user.click(screen.getByRole('button', { name: 'Apply filters' }));

    expect(screen.getByRole('alert')).toHaveTextContent('The end date must be on or after the start date.');
    expect(onChange).not.toHaveBeenCalledWith(expect.objectContaining({ from: '2026-11-20' }));
  });

  it('applies a valid advanced date and amount range', async () => {
    const user = userEvent.setup();
    const { onChange } = renderFilters();

    await user.click(screen.getByRole('button', { name: /^Filters/ }));

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-11-01' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-11-20' } });
    await user.type(screen.getByLabelText('Min amount'), '10');
    await user.type(screen.getByLabelText('Max amount'), '200');
    await user.click(screen.getByRole('button', { name: 'Apply filters' }));

    expect(onChange).toHaveBeenCalledWith({
      from: '2026-11-01',
      to: '2026-11-20',
      min: '10',
      max: '200',
    });
  });

  it('shows active filter chips and clears them individually or all at once', async () => {
    const user = userEvent.setup();
    const { onChange, onClear } = renderFilters({
      search: 'coffee',
      type: 'expense',
      category: 'category-1',
      account: 'account-1',
      from: '2026-11-01',
      to: '2026-11-12',
      min: '10',
      max: '100',
    });

    expect(screen.getByRole('button', { name: 'Remove filter Expenses' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove filter Groceries' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove filter Everyday' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove filter “coffee”' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove filter Groceries' }));
    expect(onChange).toHaveBeenCalledWith({ category: '' });

    await user.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
