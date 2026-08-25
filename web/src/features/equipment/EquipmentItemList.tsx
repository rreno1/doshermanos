import type { EquipmentItem } from './equipment.types';

type Props = {
  items: EquipmentItem[];
  onEdit: (item: EquipmentItem) => void;
};

export function EquipmentItemList({ items, onEdit }: Props) {
  if (items.length === 0) {
    return <div className="management-empty-state">No equipment matches the current view.</div>;
  }

  return (
    <div className="management-table-wrap">
      <table className="management-table">
        <thead>
          <tr>
            <th scope="col">Equipment</th>
            <th scope="col">Total</th>
            <th scope="col">Available</th>
            <th scope="col">In use</th>
            <th scope="col">Damaged</th>
            <th scope="col">Missing</th>
            <th scope="col">Status</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <div className="management-table-primary">
                  <strong>{item.name}</strong>
                  <span>{item.unit}</span>
                </div>
              </td>
              <td>{item.totalQuantity.toLocaleString('en-PH')}</td>
              <td>{item.availableQuantity.toLocaleString('en-PH')}</td>
              <td>{item.inUseQuantity.toLocaleString('en-PH')}</td>
              <td>{renderIssueCount(item.damagedQuantity)}</td>
              <td>{renderIssueCount(item.missingQuantity)}</td>
              <td>
                <span className={item.isActive ? 'management-status-badge management-status-badge-active' : 'management-status-badge management-status-badge-muted'}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <div className="management-table-actions">
                  <button type="button" className="management-row-button" onClick={() => onEdit(item)}>
                    Edit
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderIssueCount(value: number) {
  if (value === 0) {
    return '0';
  }

  return <span className="management-status-badge management-status-badge-warn">{value}</span>;
}
