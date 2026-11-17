import { cx } from '../../lib/cx';

export function SectionHeader({ title, description, action, className = '' }) {
  return (
    <div className={cx('section-header', className)}>
      <div className="section-header__text">
        <h2 className="section-header__title">{title}</h2>
        {description && <p className="section-header__description">{description}</p>}
      </div>
      {action && <div className="section-header__action">{action}</div>}
    </div>
  );
}
