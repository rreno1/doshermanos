import type { EquipmentTransactionRecord } from './equipment.types';
import './equipment-activity.css';

type Props = {
  transactions: EquipmentTransactionRecord[];
  isLoading: boolean;
  hasError: boolean;
};

export function EquipmentActivityList({ transactions, isLoading, hasError }: Props) {
  if (isLoading) {
    return <div className="equipment-activity-status" role="status">Loading equipment activity…</div>;
  }

  if (hasError) {
    return (
      <div className="equipment-activity-status equipment-activity-status-error" role="alert">
        Equipment activity could not be loaded.
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="equipment-activity-status">
        Physical release and return records will appear here.
      </div>
    );
  }

  return (
    <ol className="equipment-activity-list">
      {transactions.map((transaction) => (
        <li className="equipment-activity-entry" key={transaction.id}>
          <div className="equipment-activity-heading">
            <div>
              <span className={`equipment-activity-type equipment-activity-type-${transaction.type}`}>
                {transaction.type === 'release' ? 'Released' : 'Returned'}
              </span>
              <strong>{transaction.equipmentName}</strong>
            </div>
            <time dateTime={transaction.createdAt.toISOString()}>
              {formatActivityDate(transaction.createdAt)}
            </time>
          </div>

          <p className="equipment-activity-quantity">
            {transaction.quantity} {transaction.unit}
          </p>

          {transaction.type === 'return' ? (
            <div className="equipment-activity-return" aria-label="Return accountability">
              <ActivityCount label="Usable" value={transaction.returnedGoodQuantity} />
              <ActivityCount label="Damaged" value={transaction.damagedQuantity} warn={transaction.damagedQuantity > 0} />
              <ActivityCount label="Missing" value={transaction.missingQuantity} warn={transaction.missingQuantity > 0} />
            </div>
          ) : null}

          {transaction.note ? <p className="equipment-activity-note">{transaction.note}</p> : null}
          <p className="equipment-activity-recorder">Recorded by {transaction.recordedByName}</p>
        </li>
      ))}
    </ol>
  );
}

function ActivityCount({ label, value, warn = false }: { label: string; value: number; warn?: boolean }) {
  return (
    <span className={warn ? 'equipment-activity-count equipment-activity-count-warn' : 'equipment-activity-count'}>
      {label}: <strong>{value}</strong>
    </span>
  );
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
