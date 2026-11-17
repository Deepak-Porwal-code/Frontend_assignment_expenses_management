import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from 'lucide-react';
import { AuthLayout } from '../components/layout/AuthLayout';
import { TextField } from '../components/ui/Field';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { cx } from '../lib/cx';

function passwordChecks(password) {
  return [
    { key: 'length', label: 'At least 8 characters', valid: password.length >= 8 },
    { key: 'letter', label: 'Includes a letter', valid: /[A-Za-z]/.test(password) },
    { key: 'number', label: 'Includes a number', valid: /\d/.test(password) },
  ];
}

export default function RegisterPage() {
  useDocumentTitle('Create account');

  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const checks = passwordChecks(form.password);

  const update = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setFieldErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (form.name.trim().length < 2) nextErrors.name = 'Enter your full name.';
    if (!form.email.trim()) nextErrors.email = 'Enter your email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (form.password.length < 8) nextErrors.password = 'Use at least 8 characters.';
    else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      nextErrors.password = 'Include at least one letter and one number.';
    }
    if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = 'The passwords don’t match.';
    }

    setFieldErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setFormError(error.message);
      if (error.details?.length) {
        const details = {};
        error.details.forEach((detail) => {
          if (detail.field) details[detail.field] = detail.message;
        });
        setFieldErrors(details);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-form">
        <header className="auth-form__header">
          <p className="auth-form__eyebrow">Get started</p>
          <h1 className="auth-form__title">Create your account</h1>
          <p className="auth-form__subtitle">
            Two starter accounts and thoughtful categories are set up for you.
          </p>
        </header>

        {formError && <div className="form-alert" role="alert">{formError}</div>}

        <form className="auth-form__body" onSubmit={handleSubmit} noValidate>
          <TextField
            label="Full name"
            autoComplete="name"
            placeholder="Alex Morgan"
            leadingIcon={UserRound}
            value={form.name}
            onChange={(event) => update('name', event.target.value)}
            error={fieldErrors.name}
            required
          />

          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            leadingIcon={Mail}
            value={form.email}
            onChange={(event) => update('email', event.target.value)}
            error={fieldErrors.email}
            required
          />

          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            leadingIcon={LockKeyhole}
            value={form.password}
            onChange={(event) => update('password', event.target.value)}
            error={fieldErrors.password}
            required
            suffix={(
              <button
                type="button"
                className="input-suffix-button"
                onClick={() => setShowPassword((previous) => !previous)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}
          />

          <ul className="password-checks" aria-label="Password requirements">
            {checks.map((check) => (
              <li key={check.key} className={cx(check.valid && 'is-valid')}>
                <span className="password-checks__icon" aria-hidden="true">
                  <Check size={11} strokeWidth={3} />
                </span>
                {check.label}
              </li>
            ))}
          </ul>

          <TextField
            label="Confirm password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Type it once more"
            leadingIcon={LockKeyhole}
            value={form.confirmPassword}
            onChange={(event) => update('confirmPassword', event.target.value)}
            error={fieldErrors.confirmPassword}
            required
          />

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={submitting}
            iconRight={ArrowRight}
            className="auth-form__submit"
          >
            Create account
          </Button>
        </form>

        <p className="auth-form__switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>

        <p className="auth-form__terms">
          By creating an account you agree to keep your login details private.
          Moneta never shares your financial data.
        </p>
      </div>
    </AuthLayout>
  );
}
