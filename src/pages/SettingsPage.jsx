import { useState } from 'react';
import {
  Check,
  CircleDollarSign,
  Database,
  Lock,
  LogOut,
  Monitor,
  Moon,
  Palette,
  ShieldCheck,
  Sparkles,
  Sun,
  UserCheck,
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { TextField, SelectField } from '../components/ui/Field';
import { Avatar } from '../components/ui/Avatar';
import { LogoMark } from '../components/ui/Logo';
import { CategoryManager } from '../components/categories/CategoryManager';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useAppData } from '../context/AppDataContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { api } from '../api/client';
import { APP_NAME, CURRENCIES } from '../lib/constants';
import { formatDate, pluralize } from '../lib/format';
import { cx } from '../lib/cx';

const THEME_OPTIONS = [
  {
    value: 'system',
    label: 'System',
    description: 'Follows your device',
    icon: Monitor,
  },
  {
    value: 'light',
    label: 'Light',
    description: 'Bright and airy',
    icon: Sun,
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Easy on the eyes',
    icon: Moon,
  },
];

const ABOUT_ROWS = [
  { label: 'Version', value: '1.0.0' },
  { label: 'Built with', value: 'React · Express · MongoDB' },
  { label: 'Charts', value: 'Recharts' },
  { label: 'Your data', value: 'Private to your account' },
];

function ProfileCard() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    name: user?.name || '',
    currency: user?.currency || 'USD',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const dirty = form.name.trim() !== (user?.name || '') || form.currency !== user?.currency;

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
    const name = form.name.trim();

    if (name.length < 2) {
      setErrors({ name: 'Your name needs at least 2 characters.' });
      return;
    }

    setErrors({});
    setFormError('');
    setSaving(true);

    try {
      const payload = await api('/auth/profile', {
        method: 'PATCH',
        body: { name, currency: form.currency },
      });
      updateUser(payload.user);
      toast.success('Profile updated', 'Your details are saved.');
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
      setSaving(false);
    }
  };

  return (
    <section className="settings-card" aria-labelledby="profile-heading">
      <header className="settings-card__header">
        <div className="settings-card__heading">
          <span className="settings-card__icon" aria-hidden="true">
            <UserCheck size={20} strokeWidth={1.9} />
          </span>
          <div>
            <h2 className="settings-card__title" id="profile-heading">Profile</h2>
            <p className="settings-card__description">The name and currency used across your workspace.</p>
          </div>
        </div>
      </header>

      <div className="profile-card">
        <Avatar name={user?.name} size="lg" />
        <div className="profile-card__identity">
          <p className="profile-card__name">{user?.name}</p>
          <p className="profile-card__meta">
            {user?.email}
            {user?.createdAt && ` · Joined ${formatDate(user.createdAt, 'month')}`}
          </p>
        </div>
      </div>

      <form className="settings-form" onSubmit={handleSubmit} noValidate>
        {formError && <div className="form-alert" role="alert">{formError}</div>}

        <TextField
          label="Full name"
          value={form.name}
          maxLength={60}
          autoComplete="name"
          onChange={(event) => update('name', event.target.value)}
          error={errors.name}
        />

        <TextField
          label="Email"
          value={user?.email || ''}
          hint="Your email is your sign-in address and can’t be changed here."
          disabled
          readOnly
        />

        <SelectField
          label="Display currency"
          value={form.currency}
          hint="Changes how amounts are formatted. Stored values stay the same."
          onChange={(event) => update('currency', event.target.value)}
          error={errors.currency}
        >
          {CURRENCIES.map((currency) => (
            <option key={currency.value} value={currency.value}>
              {currency.label} ({currency.symbol})
            </option>
          ))}
        </SelectField>

        <div className="settings-form__actions">
          <Button type="submit" loading={saving} disabled={!dirty}>
            Save changes
          </Button>
          {dirty && (
            <Button
              variant="ghost"
              onClick={() => {
                setForm({ name: user?.name || '', currency: user?.currency || 'USD' });
                setErrors({});
                setFormError('');
              }}
              disabled={saving}
            >
              Reset
            </Button>
          )}
        </div>
      </form>
    </section>
  );
}

function AppearanceCard() {
  const { setting, resolved, setTheme } = useTheme();

  return (
    <section className="settings-card" aria-labelledby="appearance-heading">
      <header className="settings-card__header">
        <div className="settings-card__heading">
          <span className="settings-card__icon" aria-hidden="true">
            <Palette size={20} strokeWidth={1.9} />
          </span>
          <div>
            <h2 className="settings-card__title" id="appearance-heading">Appearance</h2>
            <p className="settings-card__description">
              {setting === 'system'
                ? `Following your device — currently ${resolved}.`
                : `Always ${resolved}, on every visit.`}
            </p>
          </div>
        </div>
      </header>

      <div className="theme-options" role="radiogroup" aria-label="Theme">
        {THEME_OPTIONS.map((option) => {
          const Icon = option.icon;
          const selected = setting === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              className={cx('theme-option', selected && 'is-selected')}
              onClick={() => setTheme(option.value)}
            >
              <span className={cx('theme-option__preview', `theme-option__preview--${option.value}`)} aria-hidden="true">
                <span className="theme-option__preview-sidebar" />
                <span className="theme-option__preview-main">
                  <span className="theme-option__preview-bar" />
                  <span className="theme-option__preview-bar theme-option__preview-bar--short" />
                  <span className="theme-option__preview-card" />
                </span>
              </span>
              <span className="theme-option__footer">
                <span className="theme-option__label">
                  <Icon size={15} strokeWidth={2} aria-hidden="true" />
                  {option.label}
                </span>
                {selected && (
                  <span className="theme-option__check" aria-hidden="true">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </span>
              <span className="theme-option__description">{option.description}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SecurityCard() {
  const { logout } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await logout();
    setSigningOut(false);
  };

  return (
    <section className="settings-card" aria-labelledby="security-heading">
      <header className="settings-card__header">
        <div className="settings-card__heading">
          <span className="settings-card__icon" aria-hidden="true">
            <ShieldCheck size={20} strokeWidth={1.9} />
          </span>
          <div>
            <h2 className="settings-card__title" id="security-heading">Security</h2>
            <p className="settings-card__description">How your account stays yours.</p>
          </div>
        </div>
      </header>

      <ul className="settings-list">
        <li className="settings-row">
          <span className="settings-row__icon" aria-hidden="true"><Lock size={17} strokeWidth={1.9} /></span>
          <div className="settings-row__text">
            <p className="settings-row__label">Password</p>
            <p className="settings-row__value">Hashed with bcrypt — never stored as plain text</p>
          </div>
        </li>
        <li className="settings-row">
          <span className="settings-row__icon" aria-hidden="true"><ShieldCheck size={17} strokeWidth={1.9} /></span>
          <div className="settings-row__text">
            <p className="settings-row__label">Session</p>
            <p className="settings-row__value">Secure httpOnly cookie, expires after 7 days</p>
          </div>
        </li>
        <li className="settings-row">
          <span className="settings-row__icon" aria-hidden="true"><Database size={17} strokeWidth={1.9} /></span>
          <div className="settings-row__text">
            <p className="settings-row__label">Data isolation</p>
            <p className="settings-row__value">Every query is scoped to your user ID</p>
          </div>
        </li>
      </ul>

      <Button
        variant="secondary"
        icon={LogOut}
        onClick={handleSignOut}
        loading={signingOut}
        fullWidth
      >
        Sign out of this device
      </Button>
    </section>
  );
}

function AboutCard() {
  const { accounts, categories } = useAppData();
  const customCategories = categories.filter((category) => !category.isDefault).length;

  return (
    <section className="settings-card" aria-labelledby="about-heading">
      <header className="settings-card__header">
        <div className="settings-card__heading">
          <span className="settings-card__icon" aria-hidden="true">
            <Sparkles size={20} strokeWidth={1.9} />
          </span>
          <div>
            <h2 className="settings-card__title" id="about-heading">About {APP_NAME}</h2>
            <p className="settings-card__description">Your money, in focus.</p>
          </div>
        </div>
      </header>

      <div className="about-brand">
        <LogoMark size={40} />
        <div>
          <p className="about-brand__name">{APP_NAME} 1.0</p>
          <p className="about-brand__meta">
            {pluralize(accounts.filter((account) => !account.isArchived).length, 'active account')} ·{' '}
            {pluralize(customCategories, 'custom category', 'custom categories')}
          </p>
        </div>
      </div>

      <dl className="about-list">
        {ABOUT_ROWS.map((row) => (
          <div className="about-row" key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>

      <p className="settings-note">
        <CircleDollarSign size={15} strokeWidth={1.9} aria-hidden="true" />
        Amounts are stored as plain numbers and formatted at display time. No bank connection is used.
      </p>
    </section>
  );
}

export default function SettingsPage() {
  useDocumentTitle('Settings');

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Manage"
        title="Settings"
        description="Small details, big difference. Tune Moneta to fit the way you think about money."
      />

      <div className="settings-grid">
        <div className="settings-column">
          <ProfileCard />
          <AppearanceCard />
          <SecurityCard />
        </div>
        <div className="settings-column settings-column--wide">
          <CategoryManager />
          <AboutCard />
        </div>
      </div>
    </div>
  );
}
