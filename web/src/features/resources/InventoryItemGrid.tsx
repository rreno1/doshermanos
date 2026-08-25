import { useResourceImageUrl } from './ResourceImagePicker';
import type { InventoryItem } from './inventory.types';
import './inventory-cards.css';

type InventoryItemGridProps = {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onUpdateStock: (item: InventoryItem) => void;
};

export function InventoryItemGrid({
  items,
  onEdit,
  onUpdateStock,
}: InventoryItemGridProps) {
  return (
    <div className="inventory-card-grid" aria-label="Inventory items">
      {items.map((item) => (
        <InventoryItemCard
          key={item.id}
          item={item}
          onEdit={() => onEdit(item)}
          onUpdateStock={() => onUpdateStock(item)}
        />
      ))}
    </div>
  );
}

function InventoryItemCard({
  item,
  onEdit,
  onUpdateStock,
}: {
  item: InventoryItem;
  onEdit: () => void;
  onUpdateStock: () => void;
}) {
  const imageUrl = useResourceImageUrl('inventory', item.id, item.updatedAt.getTime());
  const status = getInventoryStatus(item);

  return (
    <article className="inventory-card">
      <div className="inventory-card-image-wrap">
        {imageUrl ? (
          <img className="inventory-card-image" src={imageUrl} alt="" loading="lazy" />
        ) : (
          <div className="inventory-card-placeholder" aria-hidden="true">
            <InventoryPlaceholderIcon />
          </div>
        )}
      </div>

      <div className="inventory-card-body">
        <div className="inventory-card-heading">
          <div>
            <span className="inventory-card-eyebrow">Pantry inventory</span>
            <h3>{item.name}</h3>
          </div>
          <span className={status.className}>{status.label}</span>
        </div>

        <div className="inventory-card-stock">
          <span className="inventory-card-stock-value">
            {item.quantity.toLocaleString('en-PH')} {item.unit}
          </span>
          <span className="inventory-card-threshold">
            Low stock at {item.lowStockThreshold.toLocaleString('en-PH')} {item.unit}
          </span>
        </div>

        <div className="inventory-card-actions">
          <button type="button" className="management-row-button" onClick={onEdit}>
            Edit
          </button>
          <button
            type="button"
            className="management-primary-button"
            disabled={!item.isActive}
            onClick={onUpdateStock}
          >
            Update stock
          </button>
        </div>
      </div>
    </article>
  );
}

function getInventoryStatus(item: InventoryItem) {
  if (!item.isActive) {
    return {
      label: 'Inactive',
      className: 'management-status-badge management-status-badge-muted',
    };
  }

  if (item.quantity === 0) {
    return {
      label: 'Out of stock',
      className: 'management-status-badge management-status-badge-danger',
    };
  }

  if (item.quantity <= item.lowStockThreshold) {
    return {
      label: 'Low stock',
      className: 'management-status-badge management-status-badge-warn',
    };
  }

  return {
    label: 'In stock',
    className: 'management-status-badge management-status-badge-active',
  };
}

function InventoryPlaceholderIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M15 12h18l-1.5 24h-15L15 12Z" />
      <path d="M18 12V9h12v3M19 20h10M19 26h10" />
    </svg>
  );
}
