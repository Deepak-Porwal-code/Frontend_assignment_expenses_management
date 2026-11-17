import { useEffect, useId, useState } from 'react';
import { Check } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { FieldGroup, TextField } from '../ui/Field';
import { AccountIcon } from '../ui/Icon';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api/client';
import { ACCOUNT_TYPES, COLOR_OPTIONS } from '../../lib/constants';
import { currencySymbol } from '../../lib/format';
import { cx } from '../../lib/cx';

export function AccountFormModal({ open, onClose, onSaved, account = null }) {
  const { user } = useAuth();
  const toast = useToast();
  const formId = useId();
  const currency = user?.currency || 'USD';

  const [form, setForm] = useState({
    name: '',
    type: 'bank',
    initialBalance: '',
    color: ACCOUNT_TYPES[1].color,
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(account);

  useEffect(() => {
    if (!open) return;
    setForm({
      name: account?.name || '',
      type: account?.type || 'bank',
      initialBalance: account ? String(account.initialBalance) : '',
      color: account?.color || ACCOUNT_TYPES[1].color,
    });
    setErrors({});
    setFormError('');
    setSubmitting(false);
  }, [open, account]);

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
    const accountType = ACCOUNT_TYPES.find((item) => item.value === type);
    setForm((previous) => ({
      ...previous,
      type,
      color: accountType?.color || previous.color,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    const balance = Number(form.initialBalance || 0);

    if (form.name.trim().length < 2) nextErrors.name = 'Give the account a name.';
    if (!Number.isFinite(balance)) nextErrors.initialBalance = 'Enter a valid starting balance.';

    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await api(isEditing ? `/accounts/${account._id}` : '/accounts', {
        method: isEditing ? 'PATCH' : 'POST',
        body: {
          name: form.name.trim(),
          type: form.type,
          initialBalance: balance,
          color: form.color,
        },
      });
      toast.success(
        isEditing ? 'Account updated' : 'Account added',
        isEditing ? 'Your balances are refreshed.' : 'Start assigning transactions to it.',
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
      title={isEditing ? 'Edit account' : 'Add an account'}
      description={isEditing
        ? 'Update the name, type or starting balance.'
        : 'Cash, bank, card or wallet — keep each balance separate.'}
      size="md"
      footer={(
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" form={formId} loading={submitting}>
            {isEditing ? 'Save account' : 'Add account'}
          </Button>
        </>
      )}
    >
      <form id={formId} className="stack" onSubmit={handleSubmit} noValidate>
        {formError && <div className="form-alert" role="alert">{formError}</div>}

        <TextField
          label="Account name"
          placeholder="e.g. Everyday checking"
          value={form.name}
          maxLength={40}
          onChange={(event) => update('name', event.target.value)}
          error={errors.name}
          data-autofocus
        />

        <FieldGroup label="Account type" error={errors.type}>
          <div className="account-type-grid" role="radiogroup" aria-label="Account type">
            {ACCOUNT_TYPES.map((type) => {
              const selected = form.type === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={cx('account-type', selected && 'is-selected')}
                  onClick={() => handleTypeChange(type.value)}
                >
                  <AccountIcon type={type.value} size="sm" />
                  <span className="account-type__label">{type.label}</span>
                  {selected && <Check className="account-type__check" size={13} strokeWidth={2.6} />}
                </button>
              );
            })}
          </div>
        </FieldGroup>

        <div className="form-grid">
          <TextField
            label="Starting balance"
            inputMode="decimal"
            prefix={currencySymbol(currency)}
            placeholder="0.00"
            value={form.initialBalance}
            onChange={(event) => {
              const value = event.target.value;
              if (value === '' || /^-?\d*\.?\d{0,2}$/.test(value)) update('initialBalance', value);
            }}
            error={errors.initialBalance}
            hint="For credit cards, use a negative balance if you owe money."
          />

          <FieldGroup label="Accent colour">
            <div className="color-picker color-picker--compact" role="radiogroup" aria-label="Account colour">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  role="radio"
                  aria-checked={form.color === color}
                  aria-label={`Colour ${color}`}
                  className={cx('color-swatch', form.color === color && 'is-selected')}
                  style={{ '--swatch': color }}
                  onClick={() => update('color', color)}
                />
              ))}
            </div>
          </FieldGroup>
        </div>
      </form>
    </Modal>
  );
}
