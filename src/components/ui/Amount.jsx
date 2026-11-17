import { formatCurrency } from '../../lib/format';
import { cx } from '../../lib/cx';

/**
 * Money with a type-aware colour and sign. Amounts are stored unsigned, so the
 * transaction type decides the + or −.
 */
export function Amount({
  value,
  currency = 'USD',
  type,
  size = 'md',
  signed = false,
  whole = false,
  className = '',
}) {
  const number = Number(value) || 0;
  const isIncome = type === 'income';
  const isExpense = type === 'expense';

  let sign = '';
  if (isIncome) sign = '+';
  else if (isExpense) sign = '−';
  else if (signed) sign = number >= 0 ? '+' : '−';

  const tone = isIncome ? 'income' : isExpense ? 'expense' : number < 0 ? 'expense' : '';

  return (
    <span className={cx('amount', tone && `amount--${tone}`, size !== 'md' && `amount--${size}`, className)}>
      {sign}
      {formatCurrency(Math.abs(number), currency, { whole })}
    </span>
  );
}
