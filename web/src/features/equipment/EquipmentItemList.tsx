import type { EquipmentItem } from './equipment.types';

type Props = {
  items: EquipmentItem[];
  onEdit: (item: EquipmentItem) => void;
};

export function EquipmentItemList({ items, onEdit }: Props) {
  if (items.length === 0) {
    return (
      <div className="equipment-status-box">
        No equipment has been registered yet. Add the first item to begin accountability tracking.
      </div>
    );
  }

  return (
    <div className="equipment-item-list">
      {items.map((item) => (
        <article className="equipment-item-row" key={item.id}>
          <div className="equipment-item-name">
            <strong>{item.name}</strong>
            <span className={item.isActive ? 'equipment-status' : 'equipment-status equipment-status-muted'}>
              {item.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <Count label="Available" value={item.availableQuantity} unit={item.unit} />
          <Count label="In use" value={item.inUseQuantity} unit={item.unit} />
          <Count label="Damaged" value={item.damagedQuantity} unit={item.unit} warn={item.damagedQuantity > 0} />
          <Count label="Missing" value={item.missingQuantity} unit={item.unit} warn={item.missingQuantity > 0} />

          <button
            type="button"
            className="equipment-secondary-button"
            onClick={() => onEdit(item)}
          >
            Edit
          </button>
        </article>
      ))}
    </div>
  );
}

function Count({
  label,
  value,
  unit,
  warn = false,
}: {
  label: string;
  value: number;
  unit: string;
  warn?: boolean;
}) {
  return (
    <div className={warn ? 'equipment-count equipment-count-warn' : 'equipment-count'}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{unit}</small>
    </div>
  );
}
