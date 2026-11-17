import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { AuthLayout } from '../components/layout/AuthLayout';
import { TextField } from '../components/ui/Field';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function LoginPage() {
  useDocumentTitle('Sign in');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = location.state?.from || '/dashboard';

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!email.trim()) nextErrors.email = 'Enter your email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!password) nextErrors.password = 'Enter your password.';

    setFieldErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(redirectTo, { replace: true });
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
          <p className="auth-form__eyebrow">Welcome back</p>
          <h1 className="auth-form__title">Sign in to Moneta</h1>
          <p className="auth-form__subtitle">
            Pick up where you left off — your month is waiting.
          </p>
        </header>

        {formError && (
          <div className="form-alert" role="alert">{formError}</div>
        )}

        <form className="auth-form__body" onSubmit={handleSubmit} noValidate>
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            leadingIcon={Mail}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={fieldErrors.email}
            required
          />

          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Your password"
            leadingIcon={LockKeyhole}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
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

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={submitting}
            iconRight={ArrowRight}
            className="auth-form__submit"
          >
            Sign in
          </Button>
        </form>

        <p className="auth-form__switch">
          New to Moneta? <Link to="/register">Create your account</Link>
        </p>

        <div className="auth-form__trust">
          <LockKeyhole size={13} strokeWidth={2} aria-hidden="true" />
          Protected by a secure, http-only session cookie.
        </div>
      </div>
    </AuthLayout>
  );
}
