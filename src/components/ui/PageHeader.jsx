import { cx } from '../../lib/cx';

export function PageHeader({ eyebrow, title, description, actions, className = '' }) {
  return (
    <header className={cx('page-header', className)}>
      <div className="page-header__text">
        {eyebrow && <p className="page-header__eyebrow">{eyebrow}</p>}
        <h1 className="page-header__title">{title}</h1>
        {description && <p className="page-header__description">{description}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}
