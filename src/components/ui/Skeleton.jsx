import { cx } from '../../lib/cx';

export function Skeleton({ width, height = 14, radius, circle = false, className = '' }) {
  return (
    <span
      className={cx('skeleton', circle && 'skeleton--circle', className)}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <span className={cx('skeleton-text', className)} aria-hidden="true">
      {Array.from({ length: lines }, (_item, index) => (
        <Skeleton key={index} width={index === lines - 1 ? '62%' : '100%'} height={11} />
      ))}
    </span>
  );
}

export function StatSkeleton() {
  return (
    <div className="stat-card" aria-hidden="true">
      <Skeleton width={40} height={40} radius={13} />
      <Skeleton width="45%" height={11} />
      <Skeleton width="70%" height={24} />
    </div>
  );
}

export function ListSkeleton({ rows = 5 }) {
  return (
    <div className="skeleton-list" aria-hidden="true">
      {Array.from({ length: rows }, (_item, index) => (
        <div className="skeleton-list__row" key={index}>
          <Skeleton width={40} height={40} radius={13} />
          <div className="skeleton-list__text">
            <Skeleton width={`${55 + (index % 3) * 12}%`} height={12} />
            <Skeleton width="35%" height={10} />
          </div>
          <Skeleton width={70} height={13} />
        </div>
      ))}
    </div>
  );
}
