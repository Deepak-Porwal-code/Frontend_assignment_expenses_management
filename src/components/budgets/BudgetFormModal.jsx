import { useEffect, useId, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { FieldGroup, SelectField, TextField } from '../ui/Field';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api/client';
import { currencySymbol } from '../../lib/format';

export function BudgetFormModal({
  open,
  onClose,
  onSaved,
  month,
  monthLabel,
  scope = 'overall',
  budget = null,
  categories = [],
  existingCategoryIds = [],
}) {
  const { user } = useAuth();
  const toast = useToast();
  const formId = useId();
  const currency = user?.currency || 'USD';

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(budget);

  useEffect(() => {
    if (!open) return;
    setAmount(budget ? String(budget.amount) : '');
    setCategory(budget?.category?._id || '');
    setErrors({});
    setFormError('');
    setSubmitting(false);
  }, [open, budget]);

  const availableCategories = categories.filter((item) => (
    !existingCategoryIds.includes(item._id) || item._id === budget?.category?._id
  ));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};

    const numeric = Number(amount);
    if (!String(amount).trim()) nextErrors.amount = 'Enter a budget amount.';
    else if (!Number.isFinite(numeric) || numeric <= 0) nextErrors.amount = 'Enter an amount greater than zero.';
    if (scope === 'category' && !category) nextErrors.category = 'Choose a category.';

    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await api('/budgets', {
        method: 'PUT',
        body: {
          month,
          amount: numeric,
          scope,
          ...(scope === 'category' ? { category } : {}),
        },
      });
      toast.success(
        isEditing ? 'Budget updated' : 'Budget set',
        scope === 'overall'
          ? `Your ${monthLabel} overall budget is ready.`
          : `We’ll track this category for ${monthLabel}.`,
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
      title={isEditing ? 'Edit budget' : scope === 'overall' ? 'Set an overall budget' : 'Add a category budget'}
      description={`${monthLabel} · a limit you can actually keep an eye on.`}
      size="sm"
      footer={(
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" form={formId} loading={submitting}>
            {isEditing ? 'Save budget' : 'Set budget'}
          </Button>
        </>
      )}
    >
      <form id={formId} className="stack" onSubmit={handleSubmit} noValidate>
        {formError && <div className="form-alert" role="alert">{formError}</div>}

        {scope === 'category' && (
          <SelectField
            label="Category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            error={errors.category}
            disabled={isEditing}
            hint={isEditing ? 'The category can’t be changed after a budget is created.' : undefined}
            data-autofocus
          >
            <option value="">Choose an expense category</option>
            {availableCategories.map((item) => (
              <option key={item._id} value={item._id}>{item.name}</option>
            ))}
          </SelectField>
        )}

        <TextField
          label="Monthly amount"
          inputMode="decimal"
          type="text"
          prefix={currencySymbol(currency)}
          placeholder="0.00"
          value={amount}
          onChange={(event) => {
            const value = event.target.value;
            if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) setAmount(value);
          }}
          error={errors.amount}
          hint={scope === 'overall'
            ? 'This caps all spending for the month.'
            : 'This caps spending in one category.'}
          data-autofocus={scope === 'overall' ? true : undefined}
        />

        <p className="form-hint">
          Moneta warns you at 50%, 75%, 90% and when you go over. Adjust any time.
        </p>
      </form>
    </Modal>
  );
}
