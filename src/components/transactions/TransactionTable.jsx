import { Paperclip, Pencil, Trash2 } from 'lucide-react';
import { CategoryIcon } from '../ui/Icon';
import { Amount } from '../ui/Amount';
import { IconButton } from '../ui/Button';
import { formatDate } from '../../lib/format';

export function TransactionTable({
  transactions,
  currency,
  onEdit,
  onDelete,
  onAttachment,
}) {
  return (
    <div className="tx-table-wrap">
      <table className="tx-table">
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Category</th>
            <th scope="col">Account</th>
            <th scope="col">Note</th>
            <th scope="col" className="is-right">Amount</th>
            <th scope="col"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction._id}>
              <td className="tx-table__date">{formatDate(transaction.date, 'medium')}</td>
              <td>
                <span className="tx-table__category">
                  <CategoryIcon category={transaction.category} size="sm" />
                  <span>{transaction.category?.name || 'Uncategorized'}</span>
                </span>
              </td>
              <td className="tx-table__muted">{transaction.account?.name || '—'}</td>
              <td className="tx-table__note">
                {transaction.note || <span className="tx-table__empty">—</span>}
                {transaction.recurring && <span className="tx-table__tag">Recurring</span>}
              </td>
              <td className="is-right">
                <Amount
                  value={transaction.amount}
                  type={transaction.type}
                  currency={currency}
                  className="tx-table__amount"
                />
              </td>
              <td>
                <div className="tx-table__actions">
                  {transaction.attachment && (
                    <IconButton
                      label={`Open attachment ${transaction.attachment.filename}`}
                      icon={Paperclip}
                      size="sm"
                      onClick={() => onAttachment(transaction)}
                    />
                  )}
                  <IconButton
                    label={`Edit transaction ${transaction.note || transaction.category?.name || ''}`}
                    icon={Pencil}
                    size="sm"
                    onClick={() => onEdit(transaction)}
                  />
                  <IconButton
                    label="Delete transaction"
                    icon={Trash2}
                    size="sm"
                    variant="ghost"
                    className="icon-button--danger"
                    onClick={() => onDelete(transaction)}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="tx-cards">
        {transactions.map((transaction) => (
          <li key={transaction._id} className="tx-card">
            <div className="tx-card__main">
              <CategoryIcon category={transaction.category} />
              <div className="tx-card__text">
                <p className="tx-card__title">
                  {transaction.note || transaction.category?.name || 'Transaction'}
                  {transaction.recurring && <span className="tx-card__tag">Recurring</span>}
                </p>
                <p className="tx-card__meta">
                  {transaction.category?.name || 'Uncategorized'} · {formatDate(transaction.date, 'medium')}
                </p>
                <p className="tx-card__account">{transaction.account?.name || '—'}</p>
              </div>
              <Amount
                value={transaction.amount}
                type={transaction.type}
                currency={currency}
                className="tx-card__amount"
              />
            </div>
            <div className="tx-card__actions">
              {transaction.attachment && (
                <button
                  type="button"
                  className="tx-card__action"
                  onClick={() => onAttachment(transaction)}
                >
                  <Paperclip size={14} strokeWidth={2} aria-hidden="true" />
                  Attachment
                </button>
              )}
              <button
                type="button"
                className="tx-card__action"
                onClick={() => onEdit(transaction)}
              >
                <Pencil size={14} strokeWidth={2} aria-hidden="true" />
                Edit
              </button>
              <button
                type="button"
                className="tx-card__action tx-card__action--danger"
                onClick={() => onDelete(transaction)}
              >
                <Trash2 size={14} strokeWidth={2} aria-hidden="true" />
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
