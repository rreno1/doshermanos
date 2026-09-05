import { useEffect, useMemo, useState } from 'react';
import {
  ManagementFilterField,
  ManagementLoadingState,
  ManagementSelect,
  ManagementTableFrame,
  ManagementToolbar,
  useManagementPage,
} from '../../app/ManagementControls';
import { useToast } from '../../app/ToastProvider';
import { EquipmentActivityList } from './EquipmentActivityList';
import { EquipmentAssignmentDialog } from './EquipmentAssignmentDialog';
import { EquipmentAssignmentList } from './EquipmentAssignmentList';
import { EquipmentItemDialog } from './EquipmentItemDialog';
import { EquipmentRegistryGrid } from './EquipmentRegistryGrid';
import { EquipmentReleaseDialog } from './EquipmentReleaseDialog';
import { EquipmentReturnDialog } from './EquipmentReturnDialog';
import {
  cancelEquipmentAssignment,
  subscribeToEquipment,
  subscribeToEquipmentAssignments,
  subscribeToEquipmentTransactions,
} from './equipment.service';
import type {
  EquipmentAssignment,
  EquipmentItem,
  EquipmentTransactionRecord,
} from './equipment.types';
import { useProgressiveItems } from './useProgressiveItems';
import './equipment.css';
import './inventory-cards.css';
import './equipment-cards.css';

export type EquipmentView = 'registry' | 'assignments' | 'activity';
type SortDirection = 'asc' | 'desc';
type EquipmentSort = 'name' | 'available' | 'total' | 'event' | 'equipment' | 'status' | 'date' | 'type';

export function EquipmentPanel({
  staffId,
  staffName,
  view,
}: {
  staffId: string;
  staffName: string;
  view: EquipmentView;
}) {
  const { showToast } = useToast();
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [assignments, setAssignments] = useState<EquipmentAssignment[]>([]);
  const [transactions, setTransactions] = useState<EquipmentTransactionRecord[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [itemsError, setItemsError] = useState(false);
  const [assignmentsError, setAssignmentsError] = useState(false);
  const [transactionsError, setTransactionsError] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);
  const [releaseAssignment, setReleaseAssignment] = useState<EquipmentAssignment | null>(null);
  const [returnAssignment, setReturnAssignment] = useState<EquipmentAssignment | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [queryText, setQueryText] = useState('');
  const [filterValue, setFilterValue] = useState('all');
  const [sortBy, setSortBy] = useState<EquipmentSort>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const staff = useMemo(() => ({ id: staffId, displayName: staffName }), [staffId, staffName]);

  useEffect(() => subscribeToEquipment(
    (nextItems) => {
      setItems(nextItems);
      setItemsError(false);
      setIsLoadingItems(false);
    },
    () => {
      setItems([]);
      setItemsError(true);
      setIsLoadingItems(false);
    },
  ), []);

  useEffect(() => subscribeToEquipmentAssignments(
    (nextAssignments) => {
      setAssignments(nextAssignments);
      setAssignmentsError(false);
      setIsLoadingAssignments(false);
    },
    () => {
      setAssignments([]);
      setAssignmentsError(true);
      setIsLoadingAssignments(false);
    },
  ), []);

  useEffect(() => subscribeToEquipmentTransactions(
    (nextTransactions) => {
      setTransactions(nextTransactions);
      setTransactionsError(false);
      setIsLoadingTransactions(false);
    },
    () => {
      setTransactions([]);
      setTransactionsError(true);
      setIsLoadingTransactions(false);
    },
  ), []);

  useEffect(() => {
    setQueryText('');
    setFilterValue('all');
    setSortDirection(view === 'registry' ? 'asc' : 'desc');
    setSortBy(view === 'registry' ? 'name' : view === 'assignments' ? 'event' : 'date');
  }, [view]);

  const activeItems = useMemo(() => items.filter((item) => item.isActive), [items]);
  const totals = useMemo(() => activeItems.reduce(
    (summary, item) => ({
      available: summary.available + item.availableQuantity,
      inUse: summary.inUse + item.inUseQuantity,
      issues: summary.issues + item.damagedQuantity + item.missingQuantity,
    }),
    { available: 0, inUse: 0, issues: 0 },
  ), [activeItems]);

  const visibleItems = useMemo(
    () => filterEquipmentItems(items, queryText, filterValue, sortBy, sortDirection),
    [items, queryText, filterValue, sortBy, sortDirection],
  );
  const visibleAssignments = useMemo(
    () => filterAssignments(assignments, queryText, filterValue, sortBy, sortDirection),
    [assignments, queryText, filterValue, sortBy, sortDirection],
  );
  const visibleTransactions = useMemo(
    () => filterTransactions(transactions, queryText, filterValue, sortBy, sortDirection),
    [transactions, queryText, filterValue, sortBy, sortDirection],
  );

  const resetKey = `${queryText}|${filterValue}|${sortBy}|${sortDirection}`;
  const itemScroll = useProgressiveItems(visibleItems, `registry|${resetKey}`);
  const assignmentPage = useManagementPage(visibleAssignments, `assignments|${resetKey}`);
  const activityPage = useManagementPage(visibleTransactions, `activity|${resetKey}`);

  function openNewItem() {
    setEditingItem(null);
    setItemDialogOpen(true);
  }

  function openItem(item: EquipmentItem) {
    setEditingItem(item);
    setItemDialogOpen(true);
  }

  async function handleCancelAssignment(assignment: EquipmentAssignment) {
    const shouldCancel = window.confirm(`Cancel the ${assignment.equipmentName} assignment for ${assignment.packageName}?`);
    if (!shouldCancel) return;

    setCancellingId(assignment.id);
    try {
      await cancelEquipmentAssignment(assignment.id);
      showToast({ message: 'Equipment assignment cancelled.', tone: 'success' });
    } catch {
      showToast({ message: 'Assignment could not be cancelled. It may have already changed.', tone: 'error' });
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="equipment-section" id="equipment" aria-label={getViewLabel(view)}>
      <ManagementToolbar
        summary={[
          { label: 'active items', value: activeItems.length },
          { label: 'available', value: totals.available },
          { label: 'in use', value: totals.inUse },
          { label: 'issues', value: totals.issues, warn: totals.issues > 0 },
        ]}
        searchValue={queryText}
        searchPlaceholder={getSearchPlaceholder(view)}
        onSearchChange={setQueryText}
        filterContent={(
          <EquipmentFilters
            view={view}
            filterValue={filterValue}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onFilterChange={setFilterValue}
            onSortChange={setSortBy}
            onDirectionChange={setSortDirection}
            onReset={() => {
              setFilterValue('all');
              setSortDirection(view === 'registry' ? 'asc' : 'desc');
              setSortBy(view === 'registry' ? 'name' : view === 'assignments' ? 'event' : 'date');
            }}
          />
        )}
        primaryAction={view === 'registry' ? (
          <button type="button" className="management-primary-button" onClick={openNewItem}>Add equipment</button>
        ) : view === 'assignments' ? (
          <button type="button" className="management-primary-button" disabled={activeItems.length === 0} onClick={() => setAssignmentDialogOpen(true)}>
            Assign to event
          </button>
        ) : undefined}
      />

      {renderActiveView()}

      <EquipmentItemDialog isOpen={itemDialogOpen} item={editingItem} onClose={() => setItemDialogOpen(false)} />
      <EquipmentAssignmentDialog isOpen={assignmentDialogOpen} equipment={items} staff={staff} onClose={() => setAssignmentDialogOpen(false)} />
      <EquipmentReleaseDialog assignment={releaseAssignment} staff={staff} onClose={() => setReleaseAssignment(null)} />
      <EquipmentReturnDialog assignment={returnAssignment} staff={staff} onClose={() => setReturnAssignment(null)} />
    </div>
  );

  function renderActiveView() {
    if (view === 'registry') {
      const emptyMessage = items.length === 0
        ? 'No equipment has been registered yet.'
        : visibleItems.length === 0
          ? 'No equipment matches the current view.'
          : undefined;

      if (isLoadingItems) {
        return <ManagementLoadingState message="Loading equipment registry…" />;
      }

      if (itemsError) {
        return <div className="management-empty-state management-empty-state-error" role="alert">Equipment registry could not be loaded.</div>;
      }

      if (emptyMessage) {
        return <div className="management-empty-state" role="status">{emptyMessage}</div>;
      }

      return (
        <div className="resources-progressive-list">
          <EquipmentRegistryGrid items={itemScroll.visibleItems} onEdit={openItem} />
          {itemScroll.hasMore ? (
            <div ref={itemScroll.sentinelRef} className="resources-progressive-sentinel" aria-hidden="true" />
          ) : null}
          <p className="resources-progressive-status" role="status">
            Showing {itemScroll.visibleCount.toLocaleString('en-PH')} of {visibleItems.length.toLocaleString('en-PH')} equipment items
            {itemScroll.hasMore ? ' · Scroll down to show more' : ''}
          </p>
        </div>
      );
    }

    if (view === 'assignments') {
      const emptyMessage = assignments.length === 0
        ? 'No equipment assignments yet.'
        : visibleAssignments.length === 0
          ? 'No assignments match the current view.'
          : undefined;
      return (
        <ManagementTableFrame
          loadingMessage={isLoadingAssignments ? 'Loading equipment assignments…' : undefined}
          errorMessage={!isLoadingAssignments && assignmentsError ? 'Equipment assignments could not be loaded.' : undefined}
          emptyMessage={!isLoadingAssignments && !assignmentsError ? emptyMessage : undefined}
          pagination={!isLoadingAssignments && !assignmentsError && visibleAssignments.length > 0 ? { page: assignmentPage.page, totalItems: visibleAssignments.length, onPageChange: assignmentPage.setPage } : undefined}
        >
          <EquipmentAssignmentList
            assignments={assignmentPage.pageItems}
            cancellingId={cancellingId}
            onRelease={setReleaseAssignment}
            onReturn={setReturnAssignment}
            onCancel={(assignment) => void handleCancelAssignment(assignment)}
          />
        </ManagementTableFrame>
      );
    }

    const emptyMessage = transactions.length === 0
      ? 'No equipment release or return activity yet.'
      : visibleTransactions.length === 0
        ? 'No equipment activity matches the current view.'
        : undefined;
    return (
      <ManagementTableFrame
        loadingMessage={isLoadingTransactions ? 'Loading equipment activity…' : undefined}
        errorMessage={!isLoadingTransactions && transactionsError ? 'Equipment activity could not be loaded.' : undefined}
        emptyMessage={!isLoadingTransactions && !transactionsError ? emptyMessage : undefined}
        pagination={!isLoadingTransactions && !transactionsError && visibleTransactions.length > 0 ? { page: activityPage.page, totalItems: visibleTransactions.length, onPageChange: activityPage.setPage } : undefined}
      >
        <EquipmentActivityList transactions={activityPage.pageItems} isLoading={false} hasError={false} />
      </ManagementTableFrame>
    );
  }
}

function EquipmentFilters({ view, filterValue, sortBy, sortDirection, onFilterChange, onSortChange, onDirectionChange, onReset }: {
  view: EquipmentView;
  filterValue: string;
  sortBy: EquipmentSort;
  sortDirection: SortDirection;
  onFilterChange: (value: string) => void;
  onSortChange: (value: EquipmentSort) => void;
  onDirectionChange: (value: SortDirection) => void;
  onReset: () => void;
}) {
  const filterOptions = view === 'registry'
    ? [{ value: 'all', label: 'All statuses' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]
    : view === 'assignments'
      ? [{ value: 'all', label: 'All statuses' }, { value: 'assigned', label: 'Assigned' }, { value: 'released', label: 'Released' }, { value: 'closed', label: 'Closed' }, { value: 'cancelled', label: 'Cancelled' }]
      : [{ value: 'all', label: 'All activity' }, { value: 'release', label: 'Released' }, { value: 'return', label: 'Returned' }];
  const sortOptions = view === 'registry'
    ? [{ value: 'name', label: 'Name' }, { value: 'available', label: 'Available quantity' }, { value: 'total', label: 'Total quantity' }]
    : view === 'assignments'
      ? [{ value: 'event', label: 'Event date' }, { value: 'equipment', label: 'Equipment' }, { value: 'status', label: 'Status' }]
      : [{ value: 'date', label: 'Recorded date' }, { value: 'equipment', label: 'Equipment' }, { value: 'type', label: 'Activity type' }];

  return (
    <>
      <ManagementFilterField label={view === 'activity' ? 'Activity type' : 'Status'}>
        <ManagementSelect value={filterValue} options={filterOptions} onChange={onFilterChange} ariaLabel="Filter equipment view" />
      </ManagementFilterField>
      <ManagementFilterField label="Sort by">
        <ManagementSelect value={sortBy} options={sortOptions as { value: EquipmentSort; label: string }[]} onChange={onSortChange} ariaLabel="Sort equipment view by" />
      </ManagementFilterField>
      <ManagementFilterField label="Direction">
        <ManagementSelect value={sortDirection} options={[{ value: 'asc', label: 'Ascending' }, { value: 'desc', label: 'Descending' }]} onChange={onDirectionChange} ariaLabel="Equipment sort direction" />
      </ManagementFilterField>
      <button type="button" className="management-secondary-button" onClick={onReset}>Reset filters</button>
    </>
  );
}

function filterEquipmentItems(items: EquipmentItem[], query: string, status: string, sortBy: EquipmentSort, direction: SortDirection) {
  const text = query.trim().toLocaleLowerCase();
  return [...items]
    .filter((item) => status === 'all' || (status === 'active' ? item.isActive : !item.isActive))
    .filter((item) => !text || `${item.name} ${item.unit}`.toLocaleLowerCase().includes(text))
    .sort((left, right) => compareValues(sortBy === 'available' ? left.availableQuantity : sortBy === 'total' ? left.totalQuantity : left.name, sortBy === 'available' ? right.availableQuantity : sortBy === 'total' ? right.totalQuantity : right.name, direction));
}

function filterAssignments(assignments: EquipmentAssignment[], query: string, status: string, sortBy: EquipmentSort, direction: SortDirection) {
  const text = query.trim().toLocaleLowerCase();
  return [...assignments]
    .filter((assignment) => status === 'all' || assignment.status === status)
    .filter((assignment) => !text || `${assignment.equipmentName} ${assignment.packageName} ${assignment.note} ${assignment.status}`.toLocaleLowerCase().includes(text))
    .sort((left, right) => compareValues(sortBy === 'equipment' ? left.equipmentName : sortBy === 'status' ? left.status : left.eventStartDate.getTime(), sortBy === 'equipment' ? right.equipmentName : sortBy === 'status' ? right.status : right.eventStartDate.getTime(), direction));
}

function filterTransactions(transactions: EquipmentTransactionRecord[], query: string, type: string, sortBy: EquipmentSort, direction: SortDirection) {
  const text = query.trim().toLocaleLowerCase();
  return [...transactions]
    .filter((transaction) => type === 'all' || transaction.type === type)
    .filter((transaction) => !text || `${transaction.equipmentName} ${transaction.recordedByName} ${transaction.note} ${transaction.type}`.toLocaleLowerCase().includes(text))
    .sort((left, right) => compareValues(sortBy === 'equipment' ? left.equipmentName : sortBy === 'type' ? left.type : left.createdAt.getTime(), sortBy === 'equipment' ? right.equipmentName : sortBy === 'type' ? right.type : right.createdAt.getTime(), direction));
}

function compareValues(left: string | number, right: string | number, direction: SortDirection) {
  const result = typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right), 'en-PH', { sensitivity: 'base' });
  return direction === 'asc' ? result : -result;
}

function getSearchPlaceholder(view: EquipmentView) {
  if (view === 'registry') return 'Search equipment';
  if (view === 'assignments') return 'Search assignments';
  return 'Search activity';
}

function getViewLabel(view: EquipmentView) {
  if (view === 'registry') return 'Equipment registry';
  if (view === 'assignments') return 'Equipment assignments';
  return 'Equipment activity';
}
