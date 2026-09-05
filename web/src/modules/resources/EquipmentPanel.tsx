import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@core/app/ToastProvider';
import {
  ManagementLoadingState,
  ManagementTableFrame,
  ManagementToolbar,
  useManagementPage,
} from '@shared/ui/ManagementControls';
import { EquipmentActivityList } from './EquipmentActivityList';
import { EquipmentAssignmentDialog } from './EquipmentAssignmentDialog';
import { EquipmentAssignmentList } from './EquipmentAssignmentList';
import { EquipmentFilters } from './EquipmentFilters';
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
import {
  filterAssignments,
  filterEquipmentItems,
  filterTransactions,
  getEmptyMessage,
  getSearchPlaceholder,
  getViewDefaults,
  getViewLabel,
  type EquipmentSort,
  type EquipmentView,
  type SortDirection,
} from './equipment-view';
import { useProgressiveItems } from './useProgressiveItems';
import './equipment.css';
import './inventory-cards.css';
import './equipment-cards.css';

export type { EquipmentView } from './equipment-view';

type EquipmentPanelProps = {
  staffId: string;
  staffName: string;
  view: EquipmentView;
};

export function EquipmentPanel({ staffId, staffName, view }: EquipmentPanelProps) {
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
    const defaults = getViewDefaults(view);
    setQueryText('');
    setFilterValue('all');
    setSortDirection(defaults.direction);
    setSortBy(defaults.sortBy);
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

  function resetViewControls() {
    const defaults = getViewDefaults(view);
    setFilterValue('all');
    setSortDirection(defaults.direction);
    setSortBy(defaults.sortBy);
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

  function renderActiveView() {
    if (view === 'registry') {
      if (isLoadingItems) return <ManagementLoadingState message="Loading equipment registry…" />;
      if (itemsError) {
        return <div className="management-empty-state management-empty-state-error" role="alert">Equipment registry could not be loaded.</div>;
      }

      const emptyMessage = getEmptyMessage(
        items.length,
        visibleItems.length,
        'No equipment has been registered yet.',
        'No equipment matches the current view.',
      );
      if (emptyMessage) return <div className="management-empty-state" role="status">{emptyMessage}</div>;

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
      const emptyMessage = getEmptyMessage(
        assignments.length,
        visibleAssignments.length,
        'No equipment assignments yet.',
        'No assignments match the current view.',
      );
      return (
        <ManagementTableFrame
          loadingMessage={isLoadingAssignments ? 'Loading equipment assignments…' : undefined}
          errorMessage={!isLoadingAssignments && assignmentsError ? 'Equipment assignments could not be loaded.' : undefined}
          emptyMessage={!isLoadingAssignments && !assignmentsError ? emptyMessage : undefined}
          pagination={!isLoadingAssignments && !assignmentsError && visibleAssignments.length > 0 ? {
            page: assignmentPage.page,
            totalItems: visibleAssignments.length,
            onPageChange: assignmentPage.setPage,
          } : undefined}
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

    const emptyMessage = getEmptyMessage(
      transactions.length,
      visibleTransactions.length,
      'No equipment release or return activity yet.',
      'No equipment activity matches the current view.',
    );
    return (
      <ManagementTableFrame
        loadingMessage={isLoadingTransactions ? 'Loading equipment activity…' : undefined}
        errorMessage={!isLoadingTransactions && transactionsError ? 'Equipment activity could not be loaded.' : undefined}
        emptyMessage={!isLoadingTransactions && !transactionsError ? emptyMessage : undefined}
        pagination={!isLoadingTransactions && !transactionsError && visibleTransactions.length > 0 ? {
          page: activityPage.page,
          totalItems: visibleTransactions.length,
          onPageChange: activityPage.setPage,
        } : undefined}
      >
        <EquipmentActivityList transactions={activityPage.pageItems} isLoading={false} hasError={false} />
      </ManagementTableFrame>
    );
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
            onReset={resetViewControls}
          />
        )}
        primaryAction={getPrimaryAction(view, activeItems.length, openNewItem, () => setAssignmentDialogOpen(true))}
      />

      {renderActiveView()}

      <EquipmentItemDialog isOpen={itemDialogOpen} item={editingItem} onClose={() => setItemDialogOpen(false)} />
      <EquipmentAssignmentDialog isOpen={assignmentDialogOpen} equipment={items} staff={staff} onClose={() => setAssignmentDialogOpen(false)} />
      <EquipmentReleaseDialog assignment={releaseAssignment} staff={staff} onClose={() => setReleaseAssignment(null)} />
      <EquipmentReturnDialog assignment={returnAssignment} staff={staff} onClose={() => setReturnAssignment(null)} />
    </div>
  );
}

function getPrimaryAction(view: EquipmentView, activeItemCount: number, onAdd: () => void, onAssign: () => void) {
  if (view === 'registry') {
    return <button type="button" className="management-primary-button" onClick={onAdd}>Add equipment</button>;
  }
  if (view === 'assignments') {
    return (
      <button type="button" className="management-primary-button" disabled={activeItemCount === 0} onClick={onAssign}>
        Assign to event
      </button>
    );
  }
  return undefined;
}
