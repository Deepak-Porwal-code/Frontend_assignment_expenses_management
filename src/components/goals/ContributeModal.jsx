import { useEffect, useId, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { FieldGroup } from '../ui/Field';
import { ProgressBar } from '../ui/Progress';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api/client';
import { currencySymbol, formatCurrency, formatPercent } from '../../lib/format';
import { cx } from '../../lib/cx';

export function ContributeModal({ open, onClose, onSaved, goal }) {
  const { user } = useAuth();
  const toast = useToast();
  const formId = useId();
  const currency = user?.currency || 'USD';

  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAmount('');
    setError('');
    setFormError('');
    setSubmitting(false);
  }, [open, goal]);

  if (!goal) return null;

  const remaining = Math.max(0, goal.remaining);
  const projected = Math.min(goal.targetAmount, goal.currentAmount + (Number(amount) || 0));
  const projectedPercent = goal.targetAmount > 0
    ? Math.min(100, (projected / goal.targetAmount) * 100)
    : 0;

  const quickAmounts = remaining > 0
    ? [
      { label: '25%', value: Math.round(remaining * 25) / 100 },
      { label: '50%', value: Math.round(remaining * 50) / 100 },
      { label: 'Everything', value: remaining },
    ]
    : [];

  const handleSubmit = async (event) => {
    event.preventDefault();
    const numeric = Number(amount);

    if (!String(amount).trim()) {
      setError('Enter an amount to add.');
      return;
    }
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }

    setError('');
    setFormError('');
    setSubmitting(true);
    try {
      await api(`/goals/${goal._id}`, {
        method: 'PATCH',
        body: { currentAmount: Math.round((goal.currentAmount + numeric) * 100) / 100 },
      });
      toast.success(
        'Added to your goal',
        `${formatCurrency(numeric, currency)} is now working toward ${goal.name}.`,
      );
      await onSaved?.();
      onClose();
    } catch (contributeError) {
      setFormError(contributeError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Add to ${goal.name}`}
      description={`${formatCurrency(goal.currentAmount, currency)} saved of ${formatCurrency(goal.targetAmount, currency)}.`}
      size="sm"
      footer={(
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" form={formId} loading={submitting}>Add to goal</Button>
        </>
      )}
    >
      <form id={formId} className="stack" onSubmit={handleSubmit} noValidate>
        {formError && <div className="form-alert" role="alert">{formError}</div>}

        <FieldGroup
          label="Amount to add"
          error={error}
          hint={remaining > 0 ? `${formatCurrency(remaining, currency)} to go.` : 'You’ve already reached this goal.'}
        >
          <div className={cx('amount-input', error && 'amount-input--invalid')}>
            <span className="amount-input__currency" aria-hidden="true">{currencySymbol(currency)}</span>
            <input
              className="amount-input__field"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              aria-label={`Amount in ${currency}`}
              value={amount}
              onChange={(event) => {
                const value = event.target.value;
                if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                  setAmount(value);
                  setError('');
                }
              }}
              data-autofocus
            />
          </div>
        </FieldGroup>

        {quickAmounts.length > 0 && (
          <div className="quick-amounts">
            {quickAmounts.map((quick) => (
              <button
                key={quick.label}
                type="button"
                className="quick-amount"
                onClick={() => {
                  setAmount(String(quick.value));
                  setError('');
                }}
              >
                {quick.label}
              </button>
            ))}
          </div>
        )}

        <div className="contribute-preview">
          <div className="contribute-preview__row">
            <span>New progress</span>
            <strong>{formatPercent(projectedPercent)}</strong>
          </div>
          <ProgressBar value={projectedPercent} tone="accent" label="Projected goal progress" />
        </div>
      </form>
    </Modal>
  );
}
