import { useEffect, useId, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { FieldGroup, TextField } from '../ui/Field';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api/client';
import { COLOR_OPTIONS } from '../../lib/constants';
import { currencySymbol, todayInputValue, toDateInputValue } from '../../lib/format';
import { cx } from '../../lib/cx';

export function GoalFormModal({ open, onClose, onSaved, goal = null }) {
  const { user } = useAuth();
  const toast = useToast();
  const formId = useId();
  const currency = user?.currency || 'USD';

  const [form, setForm] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: todayInputValue(),
    color: COLOR_OPTIONS[0],
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(goal);

  useEffect(() => {
    if (!open) return;
    setForm({
      name: goal?.name || '',
      targetAmount: goal ? String(goal.targetAmount) : '',
      currentAmount: goal ? String(goal.currentAmount) : '',
      targetDate: goal ? toDateInputValue(goal.targetDate) : todayInputValue(),
      color: goal?.color || COLOR_OPTIONS[0],
    });
    setErrors({});
    setFormError('');
    setSubmitting(false);
  }, [open, goal]);

  const update = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    const target = Number(form.targetAmount);
    const current = Number(form.currentAmount || 0);

    if (form.name.trim().length < 2) nextErrors.name = 'Give your goal a name.';
    if (!String(form.targetAmount).trim()) nextErrors.targetAmount = 'Enter a target amount.';
    else if (!Number.isFinite(target) || target <= 0) nextErrors.targetAmount = 'Enter an amount greater than zero.';
    if (form.currentAmount !== '' && (!Number.isFinite(current) || current < 0)) {
      nextErrors.currentAmount = 'Saved amount can’t be negative.';
    }
    if (!form.targetDate) nextErrors.targetDate = 'Choose a target date.';

    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await api(isEditing ? `/goals/${goal._id}` : '/goals', {
        method: isEditing ? 'PATCH' : 'POST',
        body: {
          name: form.name.trim(),
          targetAmount: target,
          currentAmount: current || 0,
          targetDate: form.targetDate,
          color: form.color,
        },
      });
      toast.success(
        isEditing ? 'Goal updated' : 'Goal created',
        isEditing ? 'Your target is up to date.' : 'Small steps add up. You’ve got this.',
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
      title={isEditing ? 'Edit goal' : 'Create a savings goal'}
      description={isEditing
        ? 'Adjust the target, the deadline or what you’ve saved so far.'
        : 'Name what you’re saving for. A clear target makes it real.'}
      size="sm"
      footer={(
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" form={formId} loading={submitting}>
            {isEditing ? 'Save goal' : 'Create goal'}
          </Button>
        </>
      )}
    >
      <form id={formId} className="stack" onSubmit={handleSubmit} noValidate>
        {formError && <div className="form-alert" role="alert">{formError}</div>}

        <TextField
          label="Goal name"
          placeholder="e.g. Japan trip, Emergency fund"
          value={form.name}
          maxLength={60}
          onChange={(event) => update('name', event.target.value)}
          error={errors.name}
          data-autofocus
        />

        <div className="form-grid">
          <TextField
            label="Target amount"
            inputMode="decimal"
            prefix={currencySymbol(currency)}
            placeholder="0.00"
            value={form.targetAmount}
            onChange={(event) => {
              const value = event.target.value;
              if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) update('targetAmount', value);
            }}
            error={errors.targetAmount}
          />

          <TextField
            label="Saved so far"
            inputMode="decimal"
            prefix={currencySymbol(currency)}
            placeholder="0.00"
            value={form.currentAmount}
            onChange={(event) => {
              const value = event.target.value;
              if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) update('currentAmount', value);
            }}
            error={errors.currentAmount}
          />
        </div>

        <TextField
          label="Target date"
          type="date"
          value={form.targetDate}
          onChange={(event) => update('targetDate', event.target.value)}
          error={errors.targetDate}
        />

        <FieldGroup label="Accent colour">
          <div className="color-picker" role="radiogroup" aria-label="Goal colour">
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
      </form>
    </Modal>
  );
}
