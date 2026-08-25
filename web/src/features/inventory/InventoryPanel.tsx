import { useEffect, useMemo, useState } from 'react';
import {
  ManagementFilterField,
  ManagementSelect,
  ManagementTableFrame,
  ManagementTabs,
  ManagementToolbar,
  useManagementPage,
} from '../../app/ManagementControls';
import { InventoryItemDialog } from './InventoryItemDialog';
import { InventoryMovementDialog } from './InventoryMovementDialog';
import {
  subscribeToInventory,
  subscribeToRecentInventoryMovements,
} from './inventory.service';
import type { InventoryItem, InventoryMovement } from './inventory.types';
import './inventory.css';

type InventoryTab = 'items' | 'activity';
type SortDirection = 'asc' | 'desc';
type InventorySort = 'name' | 'quantity' | 'threshold' | 'date' | 'type';

const tabs = [
  { value: 'items', label: 'Items' },
  { value: 'activity', label: 'Activity' },
] satisfies { value: InventoryTab; label: string }[];

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
  const [tab, setTab] = useState<InventoryTab>('items');
  const [queryText, setQueryText] = useState('');
  const [filterValue, setFilterValue] = useState('all');
  const [sortBy, setSortBy] = useState<InventorySort>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

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
  const visibleItems = useMemo(
    () => filterItems(items, queryText, filterValue, sortBy, sortDirection),
    [items, queryText, filterValue, sortBy, sortDirection],
  );
  const visibleMovements = useMemo(
    () => filterMovements(movements, queryText, filterValue, sortBy, sortDirection),
    [movements, queryText, filterValue, sortBy, sortDirection],
  );

  const resetKey = `${queryText}|${filterValue}|${sortBy}|${sortDirection}`;
  const itemPage = useManagementPage(visibleItems, `items|${resetKey}`);
  const movementPage = useManagementPage(visibleMovements, `activity|${resetKey}`);

  function changeTab(nextTab: InventoryTab) {
    setTab(nextTab);
    setQueryText('');
    setFilterValue('all');
    setSortBy(nextTab === 'items' ? 'name' : 'date');
    setSortDirection(nextTab === 'items' ? 'asc' : 'desc');
  }

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
    <section className="inventory-section" id="inventory" aria-label="Inventory">
      <ManagementTabs value={tab} options={tabs} onChange={changeTab} label="Inventory views" />

      <ManagementToolbar
        summary={[
          { label: 'active items', value: activeItems.length },
          { label: 'low stock', value: lowStockItems.length, warn: lowStockItems.length > 0 },
        ]}
        searchValue={queryText}
        searchPlaceholder={tab === 'items' ? 'Search inventory' : 'Search stock activity'}
        onSearchChange={setQueryText}
        filterContent={(
          <InventoryFilters
            tab={tab}
            filterValue={filterValue}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onFilterChange={setFilterValue}
            onSortChange={setSortBy}
            onDirectionChange={setSortDirection}
            onReset={() => {
              setFilterValue('all');
              setSortBy(tab === 'items' ? 'name' : 'date');
              setSortDirection(tab === 'items' ? 'asc' : 'desc');
            }}
          />
        )}
        primaryAction={tab === 'items' ? (
          <button type="button" className="management-primary-button" onClick={openNewItemDialog}>
            Add item
          </button>
        ) : undefined}
      />

      {tab === 'items' ? renderItems() : renderActivity()}

      <InventoryItemDialog isOpen={isItemDialogOpen} item={editingItem} onClose={closeItemDialog} />
      <InventoryMovementDialog
        item={stockItem}
        recordedBy={staffId}
        recordedByName={staffName}
        onClose={() => setStockItem(null)}
      />
    </section>
  );

  function renderItems() {
    const emptyMessage = items.length === 0
      ? 'No inventory items yet.'
      : visibleItems.length === 0
        ? 'No inventory items match the current view.'
        : undefined;

    return (
      <ManagementTableFrame
        loadingMessage={isLoadingItems ? 'Loading inventory items…' : undefined}
        errorMessage={!isLoadingItems && inventoryError ? 'Inventory items could not be loaded.' : undefined}
        emptyMessage={!isLoadingItems && !inventoryError ? emptyMessage : undefined}
        pagination={!isLoadingItems && !inventoryError && visibleItems.length > 0 ? {
          page: itemPage.page,
          totalItems: visibleItems.length,
          onPageChange: itemPage.setPage,
        } : undefined}
      >
        <div className="management-table-wrap">
          <table className="management-table">
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col">Quantity</th>
                <th scope="col">Low-stock threshold</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {itemPage.pageItems.map((item) => {
                const isLowStock = item.isActive && item.quantity <= item.lowStockThreshold;
                return (
                  <tr key={item.id}>
                    <td><div className="management-table-primary"><strong>{item.name}</strong><span>{item.unit}</span></div></td>
                    <td>{item.quantity.toLocaleString('en-PH')} {item.unit}</td>
                    <td>{item.lowStockThreshold.toLocaleString('en-PH')} {item.unit}</td>
                    <td><InventoryStatus item={item} isLowStock={isLowStock} /></td>
                    <td>
                      <div className="management-table-actions">
                        <button type="button" className="management-row-button" onClick={() => openEditItemDialog(item)}>Edit</button>
                        <button type="button" className="management-primary-button" disabled={!item.isActive} onClick={() => setStockItem(item)}>Update stock</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ManagementTableFrame>
    );
  }

  function renderActivity() {
    const emptyMessage = movements.length === 0
      ? 'No stock activity yet.'
      : visibleMovements.length === 0
        ? 'No stock activity matches the current view.'
        : undefined;

    return (
      <ManagementTableFrame
        loadingMessage={isLoadingMovements ? 'Loading stock activity…' : undefined}
        errorMessage={!isLoadingMovements && movementError ? 'Stock activity could not be loaded.' : undefined}
        emptyMessage={!isLoadingMovements && !movementError ? emptyMessage : undefined}
        pagination={!isLoadingMovements && !movementError && visibleMovements.length > 0 ? {
          page: movementPage.page,
          totalItems: visibleMovements.length,
          onPageChange: movementPage.setPage,
        } : undefined}
      >
        <div className="management-table-wrap">
          <table className="management-table">
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col">Movement</th>
                <th scope="col">Previous</th>
                <th scope="col">New quantity</th>
                <th scope="col">Recorded by</th>
                <th scope="col">Recorded at</th>
              </tr>
            </thead>
            <tbody>
              {movementPage.pageItems.map((movement) => (
                <tr key={movement.id}>
                  <td><div className="management-table-primary"><strong>{movement.itemName}</strong><span>{movement.note || movement.unit}</span></div></td>
                  <td><MovementBadge movement={movement} /></td>
                  <td>{movement.previousQuantity.toLocaleString('en-PH')}</td>
                  <td>{movement.newQuantity.toLocaleString('en-PH')} {movement.unit}</td>
                  <td>{movement.recordedByName}</td>
                  <td>{formatMovementTime(movement.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ManagementTableFrame>
    );
  }
}

function InventoryFilters({
  tab,
  filterValue,
  sortBy,
  sortDirection,
  onFilterChange,
  onSortChange,
  onDirectionChange,
  onReset,
}: {
  tab: InventoryTab;
  filterValue: string;
  sortBy: InventorySort;
  sortDirection: SortDirection;
  onFilterChange: (value: string) => void;
  onSortChange: (value: InventorySort) => void;
  onDirectionChange: (value: SortDirection) => void;
  onReset: () => void;
}) {
  const filterOptions = tab === 'items'
    ? [
      { value: 'all', label: 'All statuses' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'low', label: 'Low stock' },
    ]
    : [
      { value: 'all', label: 'All movement types' },
      { value: 'stock_in', label: 'Stock in' },
      { value: 'stock_out', label: 'Stock out' },
      { value: 'correction', label: 'Correction' },
    ];
  const sortOptions = tab === 'items'
    ? [
      { value: 'name', label: 'Name' },
      { value: 'quantity', label: 'Quantity' },
      { value: 'threshold', label: 'Low-stock threshold' },
    ]
    : [
      { value: 'date', label: 'Recorded date' },
      { value: 'name', label: 'Item name' },
      { value: 'type', label: 'Movement type' },
    ];

  return (
    <>
      <ManagementFilterField label={tab === 'items' ? 'Status' : 'Movement type'}>
        <ManagementSelect
          value={filterValue}
          options={filterOptions}
          onChange={onFilterChange}
          ariaLabel={tab === 'items' ? 'Filter inventory by status' : 'Filter stock activity by type'}
        />
      </ManagementFilterField>
      <ManagementFilterField label="Sort by">
        <ManagementSelect
          value={sortBy}
          options={sortOptions as { value: InventorySort; label: string }[]}
          onChange={onSortChange}
          ariaLabel="Sort inventory view by"
        />
      </ManagementFilterField>
      <ManagementFilterField label="Direction">
        <ManagementSelect
          value={sortDirection}
          options={[
            { value: 'asc', label: 'Ascending' },
            { value: 'desc', label: 'Descending' },
          ]}
          onChange={onDirectionChange}
          ariaLabel="Sort direction"
        />
      </ManagementFilterField>
      <button type="button" className="management-secondary-button" onClick={onReset}>Reset filters</button>
    </>
  );
}

function InventoryStatus({ item, isLowStock }: { item: InventoryItem; isLowStock: boolean }) {
  if (!item.isActive) return <span className="management-status-badge management-status-badge-muted">Inactive</span>;
  if (isLowStock) return <span className="management-status-badge management-status-badge-warn">Low stock</span>;
  return <span className="management-status-badge management-status-badge-active">In stock</span>;
}

function MovementBadge({ movement }: { movement: InventoryMovement }) {
  const label = movement.type === 'stock_in' ? 'Stock in' : movement.type === 'stock_out' ? 'Stock out' : 'Correction';
  const className = movement.type === 'correction'
    ? 'management-status-badge management-status-badge-warn'
    : 'management-status-badge management-status-badge-active';
  return <span className={className}>{label} · {movement.quantityChange > 0 ? '+' : ''}{movement.quantityChange}</span>;
}

function filterItems(items: InventoryItem[], query: string, status: string, sortBy: InventorySort, direction: SortDirection) {
  const text = query.trim().toLocaleLowerCase();
  return [...items]
    .filter((item) => status === 'all' || (status === 'active' && item.isActive) || (status === 'inactive' && !item.isActive) || (status === 'low' && item.isActive && item.quantity <= item.lowStockThreshold))
    .filter((item) => !text || `${item.name} ${item.unit}`.toLocaleLowerCase().includes(text))
    .sort((left, right) => compare(
      sortBy === 'quantity' ? left.quantity : sortBy === 'threshold' ? left.lowStockThreshold : left.name,
      sortBy === 'quantity' ? right.quantity : sortBy === 'threshold' ? right.lowStockThreshold : right.name,
      direction,
    ));
}

function filterMovements(movements: InventoryMovement[], query: string, type: string, sortBy: InventorySort, direction: SortDirection) {
  const text = query.trim().toLocaleLowerCase();
  return [...movements]
    .filter((movement) => type === 'all' || movement.type === type)
    .filter((movement) => !text || `${movement.itemName} ${movement.recordedByName} ${movement.note}`.toLocaleLowerCase().includes(text))
    .sort((left, right) => compare(
      sortBy === 'name' ? left.itemName : sortBy === 'type' ? left.type : left.createdAt.getTime(),
      sortBy === 'name' ? right.itemName : sortBy === 'type' ? right.type : right.createdAt.getTime(),
      direction,
    ));
}

function compare(left: string | number, right: string | number, direction: SortDirection) {
  const result = typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right), 'en-PH', { sensitivity: 'base' });
  return direction === 'asc' ? result : -result;
}

function formatMovementTime(date: Date): string {
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
