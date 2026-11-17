import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransactionFormModal } from '../components/transactions/TransactionFormModal';

const mocks = vi.hoisted(() => ({
  api: vi.fn(),
  refresh: vi.fn(),
  close: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  toastInfo: vi.fn(),
  ui: {
    open: true,
    transaction: null,
    defaults: null,
  },
}));

vi.mock('../api/client', () => ({ api: mocks.api }));

vi.mock('../context/UIContext', () => ({
  useUI: () => ({
    transactionModal: mocks.ui,
    closeTransactionModal: mocks.close,
  }),
}));

vi.mock('../context/AppDataContext', () => ({
  useAppData: () => ({
    accounts: [
      { _id: 'account-1', name: 'Everyday', type: 'bank', isArchived: false },
      { _id: 'account-2', name: 'Cash', type: 'cash', isArchived: false },
    ],
    categories: [
      { _id: 'category-1', name: 'Groceries', type: 'expense', icon: 'utensils', color: '#F97316' },
      { _id: 'category-2', name: 'Salary', type: 'income', icon: 'wallet', color: '#22C55E' },
    ],
    refresh: mocks.refresh,
  }),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { _id: 'user-1', currency: 'USD', name: 'Jane Doe' } }),
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    success: mocks.toastSuccess,
    error: mocks.toastError,
    info: mocks.toastInfo,
  }),
}));

function renderModal() {
  return render(
    <MemoryRouter>
      <TransactionFormModal />
    </MemoryRouter>,
  );
}

describe('TransactionFormModal', () => {
  beforeEach(() => {
    mocks.api.mockReset();
    mocks.refresh.mockReset().mockResolvedValue(undefined);
    mocks.close.mockReset();
    mocks.toastSuccess.mockReset();
    mocks.ui.transaction = null;
    mocks.ui.defaults = null;
  });

  it('renders the add-transaction form with account and category choices', async () => {
    const user = userEvent.setup();
    renderModal();

    expect(screen.getByRole('dialog', { name: 'Add transaction' })).toBeInTheDocument();
    expect(screen.getByLabelText('Amount in USD')).toBeInTheDocument();
    expect(screen.getByLabelText('Account')).toHaveValue('account-1');
    expect(screen.getByRole('radio', { name: 'Groceries' })).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: 'Salary' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Income' }));

    expect(screen.getByRole('radio', { name: 'Salary' })).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: 'Groceries' })).not.toBeInTheDocument();
  });

  it('validates required fields without calling the API', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: 'Add transaction' }));

    expect(screen.getByText('Enter an amount.')).toBeInTheDocument();
    expect(screen.getByText('Choose a category.')).toBeInTheDocument();
    expect(screen.getByLabelText('Account')).toHaveValue('account-1');
    expect(screen.queryByText('Choose an account.')).not.toBeInTheDocument();
    expect(mocks.api).not.toHaveBeenCalled();
  });

  it('creates an expense and refreshes the app data', async () => {
    const user = userEvent.setup();
    mocks.api.mockResolvedValue({ transaction: { _id: 'transaction-1' } });
    renderModal();

    await user.type(screen.getByLabelText('Amount in USD'), '42.50');
    await user.click(screen.getByRole('radio', { name: 'Groceries' }));
    await user.selectOptions(screen.getByLabelText('Account'), 'account-1');
    await user.type(screen.getByLabelText('Note'), 'Weekly shop');
    await user.click(screen.getByRole('button', { name: 'Add transaction' }));

    await waitFor(() => expect(mocks.api).toHaveBeenCalledTimes(1));

    const [path, options] = mocks.api.mock.calls[0];
    expect(path).toBe('/transactions');
    expect(options.method).toBe('POST');
    expect(options.body).toBeInstanceOf(FormData);
    expect(options.body.get('amount')).toBe('42.50');
    expect(options.body.get('type')).toBe('expense');
    expect(options.body.get('category')).toBe('category-1');
    expect(options.body.get('account')).toBe('account-1');
    expect(options.body.get('note')).toBe('Weekly shop');
    expect(options.body.get('date')).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Transaction saved', 'Your money is up to date.');
    expect(mocks.close).toHaveBeenCalledTimes(1);
  });

  it('maps server field errors onto the matching inputs', async () => {
    const user = userEvent.setup();
    mocks.api.mockRejectedValue({
      message: 'Please check the form and try again.',
      details: [{ field: 'amount', message: 'Amount must be at least 0.01.' }],
    });
    renderModal();

    await user.type(screen.getByLabelText('Amount in USD'), '10');
    await user.click(screen.getByRole('radio', { name: 'Groceries' }));
    await user.selectOptions(screen.getByLabelText('Account'), 'account-1');
    await user.click(screen.getByRole('button', { name: 'Add transaction' }));

    expect(await screen.findByText('Amount must be at least 0.01.')).toBeInTheDocument();
    expect(mocks.close).not.toHaveBeenCalled();
  });

  it('submits edits to the existing transaction endpoint', async () => {
    const user = userEvent.setup();
    mocks.ui.transaction = {
      _id: 'transaction-9',
      amount: 24.5,
      type: 'expense',
      category: { _id: 'category-1', name: 'Groceries', type: 'expense', icon: 'utensils', color: '#F97316' },
      account: { _id: 'account-1', name: 'Everyday' },
      note: 'Lunch',
      date: '2026-11-15T00:00:00.000Z',
      attachment: null,
      recurring: false,
    };
    mocks.api.mockResolvedValue({ transaction: { _id: 'transaction-9' } });
    renderModal();

    expect(screen.getByRole('dialog', { name: 'Edit transaction' })).toBeInTheDocument();
    const amountInput = screen.getByLabelText('Amount in USD');
    expect(amountInput).toHaveValue('24.5');

    await user.clear(amountInput);
    await user.type(amountInput, '30');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(mocks.api).toHaveBeenCalledTimes(1));

    const [path, options] = mocks.api.mock.calls[0];
    expect(path).toBe('/transactions/transaction-9');
    expect(options.method).toBe('PATCH');
    expect(options.body.get('amount')).toBe('30');
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Transaction updated', 'Your changes are in place.');
  });
});
