import { useEffect, useId, useRef, useState } from 'react';
import {
  CalendarDays,
  Check,
  FileText,
  Paperclip,
  Plus,
  Repeat2,
  Trash2,
  Wallet,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button, LinkButton } from '../ui/Button';
import { FieldGroup, SelectField, TextField, TextareaField } from '../ui/Field';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Switch } from '../ui/Switch';
import { CategoryIcon } from '../ui/Icon';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api/client';
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_LIMIT_BYTES,
  FREQUENCIES,
  TRANSACTION_TYPES,
} from '../../lib/constants';
import { currencySymbol, formatBytes, todayInputValue, toDateInputValue } from '../../lib/format';
import { cx } from '../../lib/cx';

const EMPTY_FORM = {
  amount: '',
  type: 'expense',
  category: '',
  account: '',
  note: '',
  date: todayInputValue(),
  isRecurring: false,
  frequency: 'monthly',
  removeAttachment: false,
};

const ACCEPTED_TYPES = ATTACHMENT_ACCEPT.split(',');

export function TransactionFormModal() {
  const { transactionModal, closeTransactionModal } = useUI();
  const { open, transaction } = transactionModal;
  const { accounts, categories, refresh } = useAppData();
  const { user } = useAuth();
  const toast = useToast();
  const formId = useId();
  const fileInputRef = useRef(null);
  const accountsRef = useRef(accounts);

  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  accountsRef.current = accounts;

  const isEditing = Boolean(transaction);
  const currency = user?.currency || 'USD';

  const activeAccounts = accounts.filter((account) => (
    !account.isArchived || account._id === transaction?.account?._id
  ));
  const typeCategories = categories.filter((category) => category.type === form.type);
  const existingAttachment = !form.removeAttachment && transaction?.attachment;

  useEffect(() => {
    if (!open) return;

    const source = transaction;
    setForm({
      amount: source ? String(source.amount) : '',
      type: source?.type || transactionModal.defaults?.type || 'expense',
      category: source?.category?._id || transactionModal.defaults?.category || '',
      account: source?.account?._id
        || transactionModal.defaults?.account
        || accountsRef.current.find((account) => !account.isArchived)?._id
        || '',
      note: source?.note || '',
      date: source ? toDateInputValue(source.date) : transactionModal.defaults?.date || todayInputValue(),
      isRecurring: false,
      frequency: 'monthly',
      removeAttachment: false,
    });
    setFile(null);
    setErrors({});
    setFormError('');
    setSubmitting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    // Only re-initialise when the dialog opens; edits to the form are local.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, transaction]);

  const update = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  };

  const handleTypeChange = (type) => {
    setForm((previous) => ({
      ...previous,
      type,
      category: previous.category && categories.some(
        (category) => category._id === previous.category && category.type === type,
      )
        ? previous.category
        : '',
    }));
    setErrors((previous) => {
      const next = { ...previous };
      delete next.category;
      return next;
    });
  };

  const handleFile = (event) => {
    const selected = event.target.files?.[0] || null;
    setErrors((previous) => {
      const next = { ...previous };
      delete next.attachment;
      return next;
    });

    if (!selected) {
      setFile(null);
      return;
    }
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setFile(null);
      setErrors((previous) => ({
        ...previous,
        attachment: 'Choose a JPG, PNG, WebP, GIF or PDF file.',
      }));
      event.target.value = '';
      return;
    }
    if (selected.size > ATTACHMENT_LIMIT_BYTES) {
      setFile(null);
      setErrors((previous) => ({
        ...previous,
        attachment: `That file is ${formatBytes(selected.size)}. The limit is 2 MB.`,
      }));
      event.target.value = '';
      return;
    }

    setFile(selected);
    setForm((previous) => ({ ...previous, removeAttachment: false }));
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validate = () => {
    const next = {};
    const amount = Number(form.amount);

    if (!String(form.amount).trim()) next.amount = 'Enter an amount.';
    else if (!Number.isFinite(amount) || amount <= 0) next.amount = 'Enter an amount greater than zero.';
    else if (amount > 1e12) next.amount = 'That amount is too large.';

    if (!form.category) next.category = 'Choose a category.';
    if (!form.account) next.account = 'Choose an account.';
    if (!form.date) next.date = 'Choose a date.';
    if (form.isRecurring && !form.frequency) next.frequency = 'Choose how often this repeats.';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting || !validate()) return;

    setSubmitting(true);
    setFormError('');

    const body = new FormData();
    body.append('amount', form.amount);
    body.append('type', form.type);
    body.append('category', form.category);
    body.append('account', form.account);
    body.append('note', form.note);
    body.append('date', form.date);

    if (file) body.append('attachment', file);
    if (form.isRecurring && !isEditing) {
      body.append('isRecurring', 'true');
      body.append('frequency', form.frequency);
    }
    if (isEditing && form.removeAttachment) body.append('removeAttachment', 'true');

    try {
      await api(isEditing ? `/transactions/${transaction._id}` : '/transactions', {
        method: isEditing ? 'PATCH' : 'POST',
        body,
      });

      await refresh();
      toast.success(
        isEditing ? 'Transaction updated' : 'Transaction saved',
        isEditing ? 'Your changes are in place.' : 'Your money is up to date.',
      );
      closeTransactionModal();
    } catch (error) {
      if (error.details?.length) {
        const fieldErrors = {};
        error.details.forEach((detail) => {
          if (detail.field) fieldErrors[detail.field] = detail.message;
        });
        setErrors(fieldErrors);
        if (!Object.keys(fieldErrors).length) setFormError(error.message);
      } else {
        setFormError(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const typeOptions = TRANSACTION_TYPES.map((type) => ({
    ...type,
    label: type.value === 'expense' ? 'Expense' : 'Income',
  }));

  return (
    <Modal
      open={open}
      onClose={closeTransactionModal}
      title={isEditing ? 'Edit transaction' : 'Add transaction'}
      description={isEditing
        ? 'Update the details and save when you’re ready.'
        : 'A few details now keeps your month clear later.'}
      size="lg"
      className="tx-modal"
      footer={(
        <>
          <Button variant="ghost" onClick={closeTransactionModal} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={submitting}>
            {isEditing ? 'Save changes' : 'Add transaction'}
          </Button>
        </>
      )}
    >
      <form id={formId} className="tx-form" onSubmit={handleSubmit} noValidate>
        {formError && <div className="form-alert" role="alert">{formError}</div>}

        {transaction?.recurring && (
          <div className="form-note">
            <Repeat2 size={16} strokeWidth={2} aria-hidden="true" />
            <p>This transaction came from a recurring rule. Pause or edit the rule to change future entries.</p>
          </div>
        )}

        <div className="tx-form__top">
          <FieldGroup
            label="Amount"
            error={errors.amount}
            className="tx-form__amount"
          >
            <div className={cx('amount-input', errors.amount && 'amount-input--invalid')}>
              <span className="amount-input__currency" aria-hidden="true">
                {currencySymbol(currency)}
              </span>
              <input
                className="amount-input__field"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0.00"
                aria-label={`Amount in ${currency}`}
                value={form.amount}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) update('amount', value);
                }}
                data-autofocus
              />
            </div>
          </FieldGroup>

          <FieldGroup label="Type">
            <SegmentedControl
              options={typeOptions}
              value={form.type}
              onChange={handleTypeChange}
              label="Transaction type"
              fullWidth
            />
          </FieldGroup>
        </div>

        <FieldGroup
          label="Category"
          error={errors.category}
          hint={typeCategories.length === 0 ? 'Add a category in Settings first.' : undefined}
        >
          {typeCategories.length > 0 ? (
            <div className="category-grid" role="radiogroup" aria-label="Category">
              {typeCategories.map((category) => {
                const selected = form.category === category._id;
                return (
                  <button
                    key={category._id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={cx('category-option', selected && 'is-selected')}
                    onClick={() => update('category', category._id)}
                  >
                    <CategoryIcon category={category} size="sm" />
                    <span className="category-option__name">{category.name}</span>
                    {selected && <Check className="category-option__check" size={13} strokeWidth={2.6} />}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="field__empty">
              No categories for this type yet.{' '}
              <LinkButton to="/settings" size="sm" variant="ghost" onClick={closeTransactionModal}>
                Manage categories
              </LinkButton>
            </p>
          )}
        </FieldGroup>

        <div className="form-grid">
          <SelectField
            label="Account"
            value={form.account}
            onChange={(event) => update('account', event.target.value)}
            error={errors.account}
          >
            <option value="">Select an account</option>
            {activeAccounts.map((account) => (
              <option key={account._id} value={account._id}>
                {account.name}
                {account.isArchived ? ' (archived)' : ''}
              </option>
            ))}
          </SelectField>

          <TextField
            label="Date"
            type="date"
            value={form.date}
            onChange={(event) => update('date', event.target.value)}
            error={errors.date}
          />
        </div>

        <TextareaField
          label="Note"
          placeholder="What was this for? (optional)"
          value={form.note}
          maxLength={200}
          rows={2}
          onChange={(event) => update('note', event.target.value)}
          error={errors.note}
        />

        <FieldGroup label="Attachment" error={errors.attachment} hint="JPG, PNG, WebP, GIF or PDF · up to 2 MB.">
          <div className="attach">
            {existingAttachment && !file && (
              <div className="attach__existing">
                <span className="attach__file">
                  <Paperclip size={15} strokeWidth={2} aria-hidden="true" />
                  <span className="attach__filename">{existingAttachment.filename}</span>
                  <span className="attach__size">{formatBytes(existingAttachment.size)}</span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  onClick={() => update('removeAttachment', true)}
                >
                  Remove
                </Button>
              </div>
            )}

            {file && (
              <div className="attach__existing">
                <span className="attach__file">
                  <FileText size={15} strokeWidth={2} aria-hidden="true" />
                  <span className="attach__filename">{file.name}</span>
                  <span className="attach__size">{formatBytes(file.size)}</span>
                </span>
                <Button variant="ghost" size="sm" onClick={clearFile}>
                  Clear
                </Button>
              </div>
            )}

            {form.removeAttachment && !file && (
              <p className="attach__removed">The current attachment will be removed when you save.</p>
            )}

            <label className="attach__drop" htmlFor={`${formId}-file`}>
              <Paperclip size={16} strokeWidth={2} aria-hidden="true" />
              <span>{file ? 'Choose a different file' : 'Attach a receipt'}</span>
              <input
                ref={fileInputRef}
                id={`${formId}-file`}
                className="sr-only"
                type="file"
                accept={ATTACHMENT_ACCEPT}
                onChange={handleFile}
              />
            </label>
          </div>
        </FieldGroup>

        {!isEditing && (
          <div className={cx('recurring-box', form.isRecurring && 'is-active')}>
            <div className="recurring-box__row">
              <span className="recurring-box__icon" aria-hidden="true">
                <Repeat2 size={17} strokeWidth={2} />
              </span>
              <div className="recurring-box__text">
                <p className="recurring-box__title">Repeat this transaction</p>
                <p className="recurring-box__description">
                  Moneta adds it automatically on schedule.
                </p>
              </div>
              <Switch
                checked={form.isRecurring}
                onChange={(value) => update('isRecurring', value)}
                ariaLabel="Repeat this transaction"
              />
            </div>

            {form.isRecurring && (
              <div className="recurring-box__frequency">
                <SelectField
                  label="Repeats"
                  value={form.frequency}
                  onChange={(event) => update('frequency', event.target.value)}
                  error={errors.frequency}
                >
                  {FREQUENCIES.map((frequency) => (
                    <option key={frequency.value} value={frequency.value}>
                      {frequency.label}
                    </option>
                  ))}
                </SelectField>
                <p className="recurring-box__hint">
                  <CalendarDays size={14} strokeWidth={2} aria-hidden="true" />
                  The next entry will appear after this date.
                </p>
              </div>
            )}
          </div>
        )}

        {!isEditing && activeAccounts.length === 0 && (
          <div className="form-note form-note--warning">
            <Wallet size={16} strokeWidth={2} aria-hidden="true" />
            <p>
              You need an active account first.{' '}
              <LinkButton to="/accounts" size="sm" variant="ghost" onClick={closeTransactionModal}>
                Add one
              </LinkButton>
            </p>
          </div>
        )}

        {!isEditing && !form.isRecurring && (
          <p className="tx-form__tip">
            <Plus size={13} strokeWidth={2.4} aria-hidden="true" />
            Tip: turn on repeating for rent, salary, subscriptions or anything monthly.
          </p>
        )}
      </form>
    </Modal>
  );
}
