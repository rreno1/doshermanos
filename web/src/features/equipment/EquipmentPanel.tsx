import { useEffect, useMemo, useState } from 'react';
import {
  ManagementFilterField,
  ManagementPagination,
  ManagementTabs,
  ManagementToolbar,
  useManagementPage,
} from '../../app/ManagementControls';
import { EquipmentActivityList } from './EquipmentActivityList';
import { EquipmentAssignmentDialog } from './EquipmentAssignmentDialog';
import { EquipmentAssignmentList } from './EquipmentAssignmentList';
import { EquipmentItemDialog } from './EquipmentItemDialog';
import { EquipmentItemList } from './EquipmentItemList';
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
import './equipment.css';

type EquipmentTab = 'registry' | 'assignments' | 'activity';
type SortDirection = 'asc' | 'desc';

type EquipmentSort =
  | 'name'
  | 'available'
  | 'total'
  | 'event'
  | 'equipment'
  | 'status'
  | 'date'
  | 'type';

const tabs = [
  { value: 'registry', label: 'Registry' },
  { value: 'assignments', label: 'Assignments' },
  { value: 'activity', label: 'Activity' },
] satisfies { value: EquipmentTab; label: string }[];

export function EquipmentPanel({ staffId, staffName }: { staffId: string; staffName: string }) {
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [assignments, setAssignments] = useState<EquipmentAssignment[]>([]);
  const [transactions, setTransactions] = useState<EquipmentTransactionRecord[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [itemsError, setItemsError] = useState(false);
  const [assignmentsError, setAssignmentsError] = useState(false);
  const [transactionsError, setTransactionsError] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);
  const [releaseAssignment, setReleaseAssignment] = useState<EquipmentAssignment | null>(null);
  const [returnAssignment, setReturnAssignment] = useState<EquipmentAssignment | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [tab, setTab] = useState<EquipmentTab>('registry');
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
  const itemPage = useManagementPage(visibleItems, `registry|${resetKey}`);
  const assignmentPage = useManagementPage(visibleAssignments, `assignments|${resetKey}`);
  const activityPage = useManagementPage(visibleTransactions, `activity|${resetKey}`);

  function changeTab(nextTab: EquipmentTab) {
    setTab(nextTab);
    setQueryText('');
    setFilterValue('all');
    setSortDirection(nextTab === 'registry' ? 'asc' : 'desc');
    setSortBy(nextTab === 'registry' ? 'name' : nextTab === 'assignments' ? 'event' : 'date');
  }

  function openNewItem() {
    setEditingItem(null);
    setItemDialogOpen(true);
  }

  function openItem(item: EquipmentItem) {
    setEditingItem(item);
    setItemDialogOpen(true);
  }

  async function handleCancelAssignment(assignment: EquipmentAssignment) {
    const shouldCancel = window.confirm(
      `Cancel the ${assignment.equipmentName} assignment for ${assignment.packageName}?`,
    );
    if (!shouldCancel) return;

    setCancellingId(assignment.id);
    setActionError(null);
    try {
      await cancelEquipmentAssignment(assignment.id);
    } catch {
      setActionError('Assignment could not be cancelled. It may have already changed.');
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <section className="equipment-section" id="equipment" aria-label="Equipment">
      <ManagementTabs value={tab} options={tabs} onChange={changeTab} label="Equipment views" />

      <ManagementToolbar
        summary={[
          { label: 'active items', value: activeItems.length },
          { label: 'available', value: totals.available },
          { label: 'in use', value: totals.inUse },
          { label: 'issues', value: totals.issues, warn: totals.issues > 0 },
        ]}
        searchValue={queryText}
        searchPlaceholder={getSearchPlaceholder(tab)}
        onSearchChange={setQueryText}
        filterContent={(
          <EquipmentFilters
            tab={tab}
            filterValue={filterValue}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onFilterChange={setFilterValue}
            onSortChange={setSortBy}
            onDirectionChange={setSortDirection}
            onReset={() => {
              setFilterValue('all');
              setSortDirection(tab === 'registry' ? 'asc' : 'desc');
              setSortBy(tab === 'registry' ? 'name' : tab === 'assignments' ? 'event' : 'date');
            }}
          />
        )}
        primaryAction={tab === 'registry' ? (
          <button type="button" className="management-primary-button" onClick={openNewItem}>
            Add equipment
          </button>
        ) : tab === 'assignments' ? (
          <button
            type="button"
            className="management-primary-button"
            disabled={activeItems.length === 0}
            onClick={() => setAssignmentDialogOpen(true)}
          >
            Assign to event
          </button>
        ) : undefined}
      />

      {actionError ? <p className="equipment-action-error" role="alert">{actionError}</p> : null}
      {renderActiveView()}

      <EquipmentItemDialog isOpen={itemDialogOpen} item={editingItem} onClose={() => setItemDialogOpen(false)} />
      <EquipmentAssignmentDialog
        isOpen={assignmentDialogOpen}
        equipment={items}
        staff={staff}
        onClose={() => setAssignmentDialogOpen(false)}
      />
      <EquipmentReleaseDialog assignment={releaseAssignment} staff={staff} onClose={() => setReleaseAssignment(null)} />
      <EquipmentReturnDialog assignment={returnAssignment} staff={staff} onClose={() => setReturnAssignment(null)} />
    </section>
  );

  function renderActiveView() {
    if (tab === 'registry') {
      if (isLoadingItems) return <StatusBox>Loading equipment…</StatusBox>;
      if (itemsError) return <StatusBox error>Equipment could not be loaded.</StatusBox>;
      return (
        <>
          <EquipmentItemList items={itemPage.pageItems} onEdit={openItem} />
          {visibleItems.length > 0 ? <ManagementPagination page={itemPage.page} totalItems={visibleItems.length} onPageChange={itemPage.setPage} /> : null}
        </>
      );
    }

    if (tab === 'assignments') {
      if (isLoadingAssignments) return <StatusBox>Loading assignments…</StatusBox>;
      if (assignmentsError) return <StatusBox error>Assignments could not be loaded.</StatusBox>;
      return (
        <>
          <EquipmentAssignmentList
            assignments={assignmentPage.pageItems}
            cancellingId={cancellingId}
            onRelease={setReleaseAssignment}
            onReturn={setReturnAssignment}
            onCancel={(assignment) => void handleCancelAssignment(assignment)}
          />
          {visibleAssignments.length > 0 ? <ManagementPagination page={assignmentPage.page} totalItems={visibleAssignments.length} onPageChange={assignmentPage.setPage} /> : null}
        </>
      );
    }

    return (
      <>
        <EquipmentActivityList transactions={activityPage.pageItems} isLoading={isLoadingTransactions} hasError={transactionsError} />
        {!isLoadingTransactions && !transactionsError && visibleTransactions.length > 0 ? (
          <ManagementPagination page={activityPage.page} totalItems={visibleTransactions.length} onPageChange={activityPage.setPage} />
        ) : null}
      </>
    );
  }
}

function EquipmentFilters({
  tab,
  filterValue,
  sortBy,
  sortDirection,
  onFilterChange,
  onSortChange,
  onDirectionChange,
  onReset,
}: {
  tab: EquipmentTab;
  filterValue: string;
  sortBy: EquipmentSort;
  sortDirection: SortDirection;
  onFilterChange: (value: string) => void;
  onSortChange: (value: EquipmentSort) => void;
  onDirectionChange: (value: SortDirection) => void;
  onReset: () => void;
}) {
  const filterOptions = tab === 'registry'
    ? [['all', 'All statuses'], ['active', 'Active'], ['inactive', 'Inactive']]
    : tab === 'assignments'
      ? [['all', 'All statuses'], ['assigned', 'Assigned'], ['released', 'Released'], ['closed', 'Closed'], ['cancelled', 'Cancelled']]
      : [['all', 'All activity'], ['release', 'Released'], ['return', 'Returned']];
  const sortOptions = tab === 'registry'
    ? [['name', 'Name'], ['available', 'Available quantity'], ['total', 'Total quantity']]
    : tab === 'assignments'
      ? [['event', 'Event date'], ['equipment', 'Equipment'], ['status', 'Status']]
      : [['date', 'Recorded date'], ['equipment', 'Equipment'], ['type', 'Activity type']];

  return (
    <>
      <ManagementFilterField label={tab === 'activity' ? 'Activity type' : 'Status'}>
        <select value={filterValue} onChange={(event) => onFilterChange(event.target.value)}>
          {filterOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </ManagementFilterField>
      <ManagementFilterField label="Sort by">
        <select value={sortBy} onChange={(event) => onSortChange(event.target.value as EquipmentSort)}>
          {sortOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </ManagementFilterField>
      <ManagementFilterField label="Direction">
        <select value={sortDirection} onChange={(event) => onDirectionChange(event.target.value as SortDirection)}>
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </ManagementFilterField>
      <button type="button" className="management-secondary-button" onClick={onReset}>Reset filters</button>
    </>
  );
}

function filterEquipmentItems(items: EquipmentItem[], query: string, status: string, sortBy: EquipmentSort, direction: SortDirection) {
  const text = query.trim().toLocaleLowerCase();
  return [...items]
    .filter((item) => (status === 'all' || (status === 'active' ? item.isActive : !item.isActive)))
    .filter((item) => !text || `${item.name} ${item.unit}`.toLocaleLowerCase().includes(text))
    .sort((left, right) => compareValues(
      sortBy === 'available' ? left.availableQuantity : sortBy === 'total' ? left.totalQuantity : left.name,
      sortBy === 'available' ? right.availableQuantity : sortBy === 'total' ? right.totalQuantity : right.name,
      direction,
    ));
}

function filterAssignments(assignments: EquipmentAssignment[], query: string, status: string, sortBy: EquipmentSort, direction: SortDirection) {
  const text = query.trim().toLocaleLowerCase();
  return [...assignments]
    .filter((assignment) => status === 'all' || assignment.status === status)
    .filter((assignment) => !text || `${assignment.equipmentName} ${assignment.packageName} ${assignment.note} ${assignment.status}`.toLocaleLowerCase().includes(text))
    .sort((left, right) => compareValues(
      sortBy === 'equipment' ? left.equipmentName : sortBy === 'status' ? left.status : left.eventStartDate.getTime(),
      sortBy === 'equipment' ? right.equipmentName : sortBy === 'status' ? right.status : right.eventStartDate.getTime(),
      direction,
    ));
}

function filterTransactions(transactions: EquipmentTransactionRecord[], query: string, type: string, sortBy: EquipmentSort, direction: SortDirection) {
  const text = query.trim().toLocaleLowerCase();
  return [...transactions]
    .filter((transaction) => type === 'all' || transaction.type === type)
    .filter((transaction) => !text || `${transaction.equipmentName} ${transaction.recordedByName} ${transaction.note} ${transaction.type}`.toLocaleLowerCase().includes(text))
    .sort((left, right) => compareValues(
      sortBy === 'equipment' ? left.equipmentName : sortBy === 'type' ? left.type : left.createdAt.getTime(),
      sortBy === 'equipment' ? right.equipmentName : sortBy === 'type' ? right.type : right.createdAt.getTime(),
      direction,
    ));
}

function compareValues(left: string | number, right: string | number, direction: SortDirection) {
  const result = typeof left === 'number' && typeof right === 'number'
    ? left - right
    : String(left).localeCompare(String(right), 'en-PH', { sensitivity: 'base' });
  return direction === 'asc' ? result : -result;
}

function getSearchPlaceholder(tab: EquipmentTab) {
  if (tab === 'registry') return 'Search equipment';
  if (tab === 'assignments') return 'Search assignments';
  return 'Search activity';
}

function StatusBox({ children, error = false }: { children: string; error?: boolean }) {
  return <div className={error ? 'management-empty-state management-empty-state-error' : 'management-empty-state'} role={error ? 'alert' : 'status'}>{children}</div>;
}
