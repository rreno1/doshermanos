import { useEffect, useMemo, useState } from 'react';
import { InventoryItemDialog } from './InventoryItemDialog';
import { InventoryMovementDialog } from './InventoryMovementDialog';
import {
  subscribeToInventory,
  subscribeToRecentInventoryMovements,
} from './inventory.service';
import type { InventoryItem, InventoryMovement } from './inventory.types';
import './inventory.css';

type InventoryPanelProps = {
  staffId: string;
  staffName: string;
};

export function InventoryPanel({ staffId, staffName }: InventoryPanelProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [isLoadingMovements, setIsLoadingMovements] = useState(true);
  const [inventoryError, setInventoryError] = useState(false);
  const [movementError, setMovementError] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [stockItem, setStockItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    setIsLoadingItems(true);
    setInventoryError(false);

    return subscribeToInventory(
      (nextItems) => {
        setItems(nextItems);
        setIsLoadingItems(false);
      },
      () => {
        setInventoryError(true);
        setIsLoadingItems(false);
      },
    );
  }, []);

  useEffect(() => {
    setIsLoadingMovements(true);
    setMovementError(false);

    return subscribeToRecentInventoryMovements(
      (nextMovements) => {
        setMovements(nextMovements);
        setIsLoadingMovements(false);
      },
      () => {
        setMovementError(true);
        setIsLoadingMovements(false);
      },
    );
  }, []);

  const activeItems = useMemo(() => items.filter((item) => item.isActive), [items]);
  const lowStockItems = useMemo(
    () => activeItems.filter((item) => item.quantity <= item.lowStockThreshold),
    [activeItems],
  );

  function openNewItemDialog() {
    setEditingItem(null);
    setIsItemDialogOpen(true);
  }

  function openEditItemDialog(item: InventoryItem) {
    setEditingItem(item);
    setIsItemDialogOpen(true);
  }

  function closeItemDialog() {
    setIsItemDialogOpen(false);
    setEditingItem(null);
  }

  return (
    <section className="inventory-section" id="inventory" aria-labelledby="inventory-title">
      <div className="inventory-heading">
        <div>
          <p className="inventory-kicker">Operations</p>
          <h2 id="inventory-title">Inventory</h2>
          <p>
            Track whole-number stock counts, low-stock thresholds, and every quantity change.
          </p>
        </div>
        <button
          type="button"
          className="inventory-primary-button"
          onClick={openNewItemDialog}
        >
          Add inventory item
        </button>
      </div>

      <div className="inventory-summary" aria-label="Inventory summary">
        <SummaryValue label="Active items" value={activeItems.length} />
        <SummaryValue
          label="Low stock"
          value={lowStockItems.length}
          warn={lowStockItems.length > 0}
        />
      </div>

      <div className="inventory-layout">
        <div className="inventory-main-column">
          <div className="inventory-subheading">
            <h3>Tracked items</h3>
            <span>{items.length} total</span>
          </div>
          {renderInventoryList()}
        </div>

        <aside className="inventory-activity" aria-labelledby="inventory-activity-title">
          <div className="inventory-subheading">
            <h3 id="inventory-activity-title">Recent activity</h3>
            <span>Latest 30</span>
          </div>
          {renderMovementList()}
        </aside>
      </div>

      <InventoryItemDialog
        isOpen={isItemDialogOpen}
        item={editingItem}
        onClose={closeItemDialog}
      />
      <InventoryMovementDialog
        item={stockItem}
        recordedBy={staffId}
        recordedByName={staffName}
        onClose={() => setStockItem(null)}
      />
    </section>
  );

  function renderInventoryList() {
    if (isLoadingItems) {
      return <StatusBox message="Loading inventory…" />;
    }

    if (inventoryError) {
      return <StatusBox message="We could not load inventory right now." error />;
    }

    if (items.length === 0) {
      return <StatusBox message="No inventory items are being tracked yet." />;
    }

    return (
      <div className="inventory-item-list">
        {items.map((item) => (
          <InventoryItemRow
            key={item.id}
            item={item}
            onEdit={() => openEditItemDialog(item)}
            onUpdateStock={() => setStockItem(item)}
          />
        ))}
      </div>
    );
  }

  function renderMovementList() {
    if (isLoadingMovements) {
      return <StatusBox message="Loading recent stock changes…" compact />;
    }

    if (movementError) {
      return <StatusBox message="Recent stock activity could not be loaded." error compact />;
    }

    if (movements.length === 0) {
      return <StatusBox message="Stock changes will appear here." compact />;
    }

    return (
      <ol className="inventory-movement-list">
        {movements.map((movement) => (
          <li key={movement.id} className="inventory-movement-entry">
            <div>
              <strong>{movement.itemName}</strong>
              <span>{movementLabel(movement)}</span>
            </div>
            <div className="inventory-movement-meta">
              <span>{movement.recordedByName}</span>
              <time dateTime={movement.createdAt.toISOString()}>
                {formatMovementTime(movement.createdAt)}
              </time>
            </div>
            {movement.note ? <p>{movement.note}</p> : null}
          </li>
        ))}
      </ol>
    );
  }
}

function InventoryItemRow({
  item,
  onEdit,
  onUpdateStock,
}: {
  item: InventoryItem;
  onEdit: () => void;
  onUpdateStock: () => void;
}) {
  const isLowStock = item.isActive && item.quantity <= item.lowStockThreshold;
  const statusLabel = getInventoryStatusLabel(item, isLowStock);

  return (
    <article className="inventory-item-row">
      <div className="inventory-item-name">
        <strong>{item.name}</strong>
        <span className={isLowStock ? 'inventory-status inventory-status-warn' : 'inventory-status'}>
          {statusLabel}
        </span>
      </div>
      <div className="inventory-quantity">
        <strong>{item.quantity}</strong>
        <span>{item.unit}</span>
      </div>
      <div className="inventory-threshold">
        <span>Low at</span>
        <strong>
          {item.lowStockThreshold} {item.unit}
        </strong>
      </div>
      <div className="inventory-row-actions">
        <button type="button" className="inventory-text-button" onClick={onEdit}>
          Edit
        </button>
        <button
          type="button"
          className="inventory-secondary-button"
          onClick={onUpdateStock}
          disabled={!item.isActive}
        >
          Update stock
        </button>
      </div>
    </article>
  );
}

function SummaryValue({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: number;
  warn?: boolean;
}) {
  const className = warn
    ? 'inventory-summary-value inventory-summary-warn'
    : 'inventory-summary-value';

  return (
    <div className={className}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusBox({
  message,
  error = false,
  compact = false,
}: {
  message: string;
  error?: boolean;
  compact?: boolean;
}) {
  const className = [
    'inventory-status-box',
    error ? 'inventory-status-box-error' : '',
    compact ? 'inventory-status-box-compact' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className} role={error ? 'alert' : 'status'}>
      {message}
    </div>
  );
}

function getInventoryStatusLabel(item: InventoryItem, isLowStock: boolean): string {
  if (!item.isActive) {
    return 'Inactive';
  }

  if (isLowStock) {
    return 'Low stock';
  }

  return 'In stock';
}

function movementLabel(movement: InventoryMovement): string {
  if (movement.type === 'correction') {
    return `Corrected ${movement.previousQuantity} → ${movement.newQuantity} ${movement.unit}`;
  }

  const sign = movement.quantityChange > 0 ? '+' : '';
  return `${sign}${movement.quantityChange} ${movement.unit} · now ${movement.newQuantity}`;
}

function formatMovementTime(date: Date): string {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}
