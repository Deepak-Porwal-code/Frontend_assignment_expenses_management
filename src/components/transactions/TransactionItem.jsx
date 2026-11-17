import { Paperclip } from 'lucide-react';
import { CategoryIcon } from '../ui/Icon';
import { Amount } from '../ui/Amount';
import { formatRelativeDate } from '../../lib/format';
import { cx } from '../../lib/cx';

export function TransactionItem({
  transaction,
  currency,
  onSelect,
  showAccount = true,
  className = '',
}) {
  const { category, account, note, date, type, amount, attachment } = transaction;
  const Component = onSelect ? 'button' : 'div';
  const title = note?.trim() || category?.name || 'Transaction';

  return (
    <Component
      {...(onSelect ? { type: 'button', onClick: () => onSelect(transaction) } : {})}
      className={cx('tx-item', onSelect && 'tx-item--interactive', className)}
    >
      <CategoryIcon category={category} />
      <span className="tx-item__body">
        <span className="tx-item__title">
          {title}
          {attachment && (
            <Paperclip
              size={12}
              strokeWidth={2.2}
              className="tx-item__clip"
              aria-label="Has attachment"
            />
          )}
        </span>
        <span className="tx-item__meta">
          <span>{category?.name || 'Uncategorized'}</span>
          <span aria-hidden="true">·</span>
          <span>{formatRelativeDate(date)}</span>
          {showAccount && account?.name && (
            <>
              <span aria-hidden="true">·</span>
              <span>{account.name}</span>
            </>
          )}
        </span>
      </span>
      <Amount value={amount} type={type} currency={currency} className="tx-item__amount" />
    </Component>
  );
}
