import { useEffect, useId, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { FieldGroup, SelectField, TextField, TextareaField } from '../ui/Field';
import { SegmentedControl } from '../ui/SegmentedControl';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api/client';
import { FREQUENCIES, TRANSACTION_TYPES } from '../../lib/constants';
import { currencySymbol, todayInputValue, toDateInputValue } from '../../lib/format';

const TYPE_OPTIONS = TRANSACTION_TYPES.map((type) => ({
  ...type,
  label: type.value === 'expense' ? 'Expense' : 'Income',
}));

export function RecurringFormModal({ open, onClose, onSaved, rule = null }) {
  const { accounts, categories } = useAppData();
  const { user } = useAuth();
  const toast = useToast();
  const formId = useId();
  const currency = user?.currency || 'USD';

  const [form, setForm] = useState({
    amount: '',
    type: 'expense',
    category: '',
    account: '',
    note: '',
    frequency: 'monthly',
    startDate: todayInputValue(),
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(rule);

  useEffect(() => {
    if (!open) return;
    setForm({
      amount: rule ? String(rule.amount) : '',
      type: rule?.type || 'expense',
      category: rule?.category?._id || '',
      account: rule?.account?._id || accounts.find((account) => !account.isArchived)?._id || '',
      note: rule?.note || '',
      frequency: rule?.frequency || 'monthly',
      startDate: rule ? toDateInputValue(rule.startDate) : todayInputValue(),
    });
    setErrors({});
    setFormError('');
    setSubmitting(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rule]);

  const typeCategories = categories.filter((category) => category.type === form.type);
  const selectableAccounts = accounts.filter((account) => (
    !account.isArchived || account._id === rule?.account?._id
  ));

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
      category: categories.some(
        (category) => category._id === previous.category && category.type === type,
      ) ? previous.category : '',
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    const amount = Number(form.amount);

    if (!String(form.amount).trim()) nextErrors.amount = 'Enter an amount.';
    else if (!Number.isFinite(amount) || amount <= 0) nextErrors.amount = 'Enter an amount greater than zero.';
    if (!form.category) nextErrors.category = 'Choose a category.';
    if (!form.account) nextErrors.account = 'Choose an account.';
    if (!form.frequency) nextErrors.frequency = 'Choose how often this repeats.';
    if (!form.startDate) nextErrors.startDate = 'Choose the first date.';

    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await api(isEditing ? `/recurring/${rule._id}` : '/recurring', {
        method: isEditing ? 'PATCH' : 'POST',
        body: {
          amount,
          type: form.type,
          category: form.category,
          account: form.account,
          note: form.note,
          frequency: form.frequency,
          startDate: form.startDate,
        },
      });
      toast.success(
        isEditing ? 'Recurring rule updated' : 'Recurring rule created',
        isEditing ? 'Future entries will follow the new schedule.' : 'We’ll add each occurrence automatically.',
      );
      await onSaved?.();
      onClose();
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit recurring rule' : 'New recurring rule'}
      description="Set it once — Moneta takes care of the rest."
      size="md"
      footer={(
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" form={formId} loading={submitting}>
            {isEditing ? 'Save rule' : 'Create rule'}
          </Button>
        </>
      )}
    >
      <form id={formId} className="stack" onSubmit={handleSubmit} noValidate>
        {formError && <div className="form-alert" role="alert">{formError}</div>}

        <div className="form-grid">
          <TextField
            label="Amount"
            inputMode="decimal"
            prefix={currencySymbol(currency)}
            placeholder="0.00"
            value={form.amount}
            onChange={(event) => {
              const value = event.target.value;
              if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) update('amount', value);
            }}
            error={errors.amount}
            data-autofocus
          />

          <FieldGroup label="Type">
            <SegmentedControl
              options={TYPE_OPTIONS}
              value={form.type}
              onChange={handleTypeChange}
              label="Recurring transaction type"
              fullWidth
            />
          </FieldGroup>
        </div>

        <div className="form-grid">
          <SelectField
            label="Category"
            value={form.category}
            onChange={(event) => update('category', event.target.value)}
            error={errors.category}
          >
            <option value="">Choose a category</option>
            {typeCategories.map((category) => (
              <option key={category._id} value={category._id}>{category.name}</option>
            ))}
          </SelectField>

          <SelectField
            label="Account"
            value={form.account}
            onChange={(event) => update('account', event.target.value)}
            error={errors.account}
          >
            <option value="">Choose an account</option>
            {selectableAccounts.map((account) => (
              <option key={account._id} value={account._id}>{account.name}</option>
            ))}
          </SelectField>
        </div>

        <TextareaField
          label="Note"
          placeholder="e.g. Netflix, monthly rent, salary"
          value={form.note}
          rows={2}
          maxLength={200}
          onChange={(event) => update('note', event.target.value)}
          error={errors.note}
        />

        <div className="form-grid">
          <SelectField
            label="Repeats"
            value={form.frequency}
            onChange={(event) => update('frequency', event.target.value)}
            error={errors.frequency}
          >
            {FREQUENCIES.map((frequency) => (
              <option key={frequency.value} value={frequency.value}>{frequency.label}</option>
            ))}
          </SelectField>

          <TextField
            label="First occurrence"
            type="date"
            value={form.startDate}
            onChange={(event) => update('startDate', event.target.value)}
            error={errors.startDate}
            hint={isEditing ? 'Changing this restarts the schedule.' : undefined}
          />
        </div>

        <p className="form-hint">
          If the first date is today or earlier, the first transaction is added straight away.
          Future ones appear on their own.
        </p>
      </form>
    </Modal>
  );
}
