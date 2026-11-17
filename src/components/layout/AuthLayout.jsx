import { Link } from 'react-router-dom';
import { Check, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { Logo, LogoMark } from '../ui/Logo';

const FEATURES = [
  { icon: TrendingUp, text: 'Budgets that warn you before you overspend' },
  { icon: Sparkles, text: 'Analytics that answer “where did it go?”' },
  { icon: ShieldCheck, text: 'Private, per-user data with secure sessions' },
];

const BARS = [42, 58, 46, 72, 63, 88, 74, 96];

export function AuthLayout({ children }) {
  return (
    <div className="auth">
      <aside className="auth__aside">
        <div className="auth__aside-glow auth__aside-glow--one" aria-hidden="true" />
        <div className="auth__aside-glow auth__aside-glow--two" aria-hidden="true" />
        <div className="auth__aside-top">
          <Logo size={34} light />
        </div>

        <div className="auth__pitch">
          <p className="auth__tagline">Your money, in focus.</p>
          <h1 className="auth__headline">Clarity, not spreadsheets.</h1>
          <p className="auth__lede">
            Moneta turns everyday spending into a calm, clear picture — so the
            numbers finally tell you something useful.
          </p>
          <ul className="auth__features">
            {FEATURES.map((feature) => (
              <li key={feature.text}>
                <span className="auth__feature-icon" aria-hidden="true">
                  <feature.icon size={15} strokeWidth={2.2} />
                </span>
                {feature.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="auth-preview" aria-hidden="true">
          <div className="auth-preview__card">
            <div className="auth-preview__top">
              <span>Total balance</span>
              <span className="auth-preview__pill">+8.2%</span>
            </div>
            <p className="auth-preview__balance">$12,480.20</p>
            <div className="auth-preview__bars">
              {BARS.map((height, index) => (
                <span key={index} style={{ height: `${height}%` }} />
              ))}
            </div>
            <div className="auth-preview__rows">
              <div className="auth-preview__row">
                <span className="auth-preview__dot auth-preview__dot--green" />
                <span>Salary</span>
                <strong>+$4,800</strong>
              </div>
              <div className="auth-preview__row">
                <span className="auth-preview__dot auth-preview__dot--rose" />
                <span>Groceries</span>
                <strong>−$86.40</strong>
              </div>
            </div>
          </div>
          <div className="auth-preview__float">
            <span className="auth-preview__float-icon">
              <Check size={14} strokeWidth={3} />
            </span>
            <div>
              <p>Budget on track</p>
              <span>64% used</span>
            </div>
          </div>
        </div>

        <p className="auth__aside-foot">
          <LogoMark size={16} />
          Built for people who want their money to feel simpler.
        </p>
      </aside>

      <main className="auth__main">
        <div className="auth__mobile-brand">
          <Link to="/login" aria-label="Moneta">
            <Logo size={30} />
          </Link>
        </div>
        <div className="auth__card">{children}</div>
        <p className="auth__legal">
          © {new Date().getFullYear()} Moneta. Your data stays yours.
        </p>
      </main>
    </div>
  );
}
