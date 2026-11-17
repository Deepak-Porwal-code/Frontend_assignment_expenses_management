import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TransactionTable } from '../components/transactions/TransactionTable';

const TRANSACTIONS = [
  {
    _id: 'transaction-1',
    amount: 84.2,
    type: 'expense',
    note: 'Weekly groceries',
    date: '2026-11-12T00:00:00.000Z',
    category: { name: 'Groceries', icon: 'utensils', color: '#F97316' },
    account: { name: 'Everyday' },
    attachment: { filename: 'receipt.pdf', size: 2048 },
    recurring: true,
  },
  {
    _id: 'transaction-2',
    amount: 4800,
    type: 'income',
    note: '',
    date: '2026-11-01T00:00:00.000Z',
    category: { name: 'Salary', icon: 'wallet', color: '#22C55E' },
    account: { name: 'Bank' },
    attachment: null,
    recurring: false,
  },
];

function renderTable(overrides = {}) {
  const handlers = {
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onAttachment: vi.fn(),
    ...overrides,
  };

  render(
    <TransactionTable
      transactions={TRANSACTIONS}
      currency="USD"
      {...handlers}
    />,
  );

  return handlers;
}

describe('TransactionTable', () => {
  it('renders the transaction rows with category, account, note and type-aware amounts', () => {
    renderTable();

    const table = screen.getByRole('table');

    expect(within(table).getByText('Weekly groceries')).toBeInTheDocument();
    expect(within(table).getByText('Groceries')).toBeInTheDocument();
    expect(within(table).getByText('Everyday')).toBeInTheDocument();
    expect(within(table).getByText('Recurring')).toBeInTheDocument();
    expect(within(table).getByText(/84\.20/)).toBeInTheDocument();
    expect(within(table).getByText(/4,800\.00/)).toBeInTheDocument();
    expect(within(table).getByText('+$4,800.00')).toHaveClass('amount--income');
    expect(within(table).getByText('−$84.20')).toHaveClass('amount--expense');
  });

  it('calls onEdit with the selected transaction', async () => {
    const user = userEvent.setup();
    const { onEdit } = renderTable();

    await user.click(screen.getByRole('button', { name: 'Edit transaction Weekly groceries' }));

    expect(onEdit).toHaveBeenCalledWith(TRANSACTIONS[0]);
  });

  it('calls onDelete with the selected transaction', async () => {
    const user = userEvent.setup();
    const { onDelete } = renderTable();

    const row = within(screen.getByRole('table')).getByText('Weekly groceries').closest('tr');
    await user.click(within(row).getByRole('button', { name: 'Delete transaction' }));

    expect(onDelete).toHaveBeenCalledWith(TRANSACTIONS[0]);
  });

  it('only offers an attachment action when a file exists', async () => {
    const user = userEvent.setup();
    const { onAttachment } = renderTable();

    expect(screen.getAllByRole('button', { name: /Open attachment/ })).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Open attachment receipt.pdf' }));

    expect(onAttachment).toHaveBeenCalledWith(TRANSACTIONS[0]);
  });
});
