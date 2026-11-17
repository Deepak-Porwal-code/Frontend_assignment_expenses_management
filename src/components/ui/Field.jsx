import { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cx } from '../../lib/cx';

function FieldFrame({
  id,
  label,
  hint,
  error,
  required,
  children,
  className,
}) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  return (
    <div className={cx('field', error && 'field--invalid', className)}>
      {label && (
        <label className="field__label" htmlFor={id}>
          {label}
          {required && <span className="field__required" aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="field__error" id={errorId} role="alert">{error}</p>
      ) : hint ? (
        <p className="field__hint" id={hintId}>{hint}</p>
      ) : null}
    </div>
  );
}

export function TextField({
  label,
  error,
  hint,
  required,
  leadingIcon: LeadingIcon,
  prefix,
  suffix,
  className = '',
  inputClassName = '',
  id,
  ...props
}) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;

  return (
    <FieldFrame
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      <div className={cx(
        'input-wrap',
        LeadingIcon && 'input-wrap--icon',
        prefix && 'input-wrap--prefix',
        suffix && 'input-wrap--suffix',
        error && 'input-wrap--error',
      )}>
        {LeadingIcon && (
          <LeadingIcon className="input-wrap__icon" size={17} strokeWidth={2} aria-hidden="true" />
        )}
        {prefix && <span className="input-wrap__affix">{prefix}</span>}
        <input
          id={fieldId}
          className={cx('input', inputClassName)}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          required={required}
          {...props}
        />
        {suffix && <span className="input-wrap__suffix">{suffix}</span>}
      </div>
    </FieldFrame>
  );
}

export function SelectField({
  label,
  error,
  hint,
  required,
  className = '',
  id,
  children,
  ...props
}) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;

  return (
    <FieldFrame
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      <div className={cx('select-wrap', error && 'input-wrap--error')}>
        <select
          id={fieldId}
          className="select"
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          required={required}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="select-wrap__chevron" size={16} strokeWidth={2} aria-hidden="true" />
      </div>
    </FieldFrame>
  );
}

export function TextareaField({
  label,
  error,
  hint,
  required,
  className = '',
  id,
  ...props
}) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;

  return (
    <FieldFrame
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      <textarea
        id={fieldId}
        className={cx('input textarea', error && 'input--error')}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        required={required}
        {...props}
      />
    </FieldFrame>
  );
}

export function FieldGroup({ label, hint, error, required, children, className = '' }) {
  return (
    <div className={cx('field', error && 'field--invalid', className)}>
      {label && (
        <p className="field__label">
          {label}
          {required && <span className="field__required" aria-hidden="true">*</span>}
        </p>
      )}
      {children}
      {error ? <p className="field__error" role="alert">{error}</p> : hint ? <p className="field__hint">{hint}</p> : null}
    </div>
  );
}
