import type { EquipmentTransactionRecord } from './equipment.types';

type Props = {
  transactions: EquipmentTransactionRecord[];
  isLoading: boolean;
  hasError: boolean;
};

export function EquipmentActivityList({ transactions, isLoading, hasError }: Props) {
  if (isLoading) {
    return <div className="management-empty-state" role="status">Loading equipment activity…</div>;
  }

  if (hasError) {
    return <div className="management-empty-state management-empty-state-error" role="alert">Equipment activity could not be loaded.</div>;
  }

  if (transactions.length === 0) {
    return <div className="management-empty-state">No activity matches the current view.</div>;
  }

  return (
    <div className="management-table-wrap">
      <table className="management-table">
        <thead>
          <tr>
            <th scope="col">Equipment</th>
            <th scope="col">Type</th>
            <th scope="col">Quantity</th>
            <th scope="col">Return accountability</th>
            <th scope="col">Recorded by</th>
            <th scope="col">Recorded at</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td>
                <div className="management-table-primary">
                  <strong>{transaction.equipmentName}</strong>
                  <span>{transaction.note || transaction.unit}</span>
                </div>
              </td>
              <td>
                <span className={transaction.type === 'return' ? 'management-status-badge management-status-badge-good' : 'management-status-badge management-status-badge-active'}>
                  {transaction.type === 'release' ? 'Released' : 'Returned'}
                </span>
              </td>
              <td>{transaction.quantity.toLocaleString('en-PH')} {transaction.unit}</td>
              <td>{formatReturnAccountability(transaction)}</td>
              <td>{transaction.recordedByName}</td>
              <td>{formatActivityDate(transaction.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatReturnAccountability(transaction: EquipmentTransactionRecord) {
  if (transaction.type !== 'return') {
    return '—';
  }

  return `${transaction.returnedGoodQuantity} usable · ${transaction.damagedQuantity} damaged · ${transaction.missingQuantity} missing`;
}

function formatActivityDate(date: Date): string {
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}
