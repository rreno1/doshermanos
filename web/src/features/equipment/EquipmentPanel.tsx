import { useEffect, useMemo, useState } from 'react';
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

  const staff = useMemo(
    () => ({ id: staffId, displayName: staffName }),
    [staffId, staffName],
  );

  useEffect(() => {
    return subscribeToEquipment(
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
    );
  }, []);

  useEffect(() => {
    return subscribeToEquipmentAssignments(
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
    );
  }, []);

  useEffect(() => {
    return subscribeToEquipmentTransactions(
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
    );
  }, []);

  const activeItems = items.filter((item) => item.isActive);
  const totals = activeItems.reduce(
    (summary, item) => ({
      available: summary.available + item.availableQuantity,
      inUse: summary.inUse + item.inUseQuantity,
      issues: summary.issues + item.damagedQuantity + item.missingQuantity,
    }),
    { available: 0, inUse: 0, issues: 0 },
  );

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
    if (!shouldCancel) {
      return;
    }

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
      <div className="equipment-heading">
        <div className="equipment-heading-actions">
          <button type="button" className="equipment-secondary-button" onClick={openNewItem}>
            Add equipment
          </button>
          <button
            type="button"
            className="equipment-primary-button"
            disabled={activeItems.length === 0}
            onClick={() => setAssignmentDialogOpen(true)}
          >
            Assign to event
          </button>
        </div>
      </div>

      <div className="equipment-summary" aria-label="Equipment summary">
        <Summary label="Active items" value={activeItems.length} />
        <Summary label="Available" value={totals.available} />
        <Summary label="In use" value={totals.inUse} />
        <Summary label="Issues" value={totals.issues} warn={totals.issues > 0} />
      </div>

      {actionError ? (
        <p className="equipment-action-error" role="alert">
          {actionError}
        </p>
      ) : null}

      <div className="equipment-layout">
        <div className="equipment-column">
          <div className="equipment-subheading">
            <h3>Registry</h3>
            <span>{items.length} of 100 shown</span>
          </div>
          {renderItems()}
        </div>

        <div className="equipment-column">
          <div className="equipment-subheading">
            <h3>Event assignments</h3>
            <span>Latest 60</span>
          </div>
          {renderAssignments()}
        </div>
      </div>

      <div className="equipment-activity">
        <div className="equipment-activity-header">
          <h3>Recent activity</h3>
          <span>Latest 30</span>
        </div>
        <EquipmentActivityList
          transactions={transactions}
          isLoading={isLoadingTransactions}
          hasError={transactionsError}
        />
      </div>

      <EquipmentItemDialog
        isOpen={itemDialogOpen}
        item={editingItem}
        onClose={() => setItemDialogOpen(false)}
      />
      <EquipmentAssignmentDialog
        isOpen={assignmentDialogOpen}
        equipment={items}
        staff={staff}
        onClose={() => setAssignmentDialogOpen(false)}
      />
      <EquipmentReleaseDialog
        assignment={releaseAssignment}
        staff={staff}
        onClose={() => setReleaseAssignment(null)}
      />
      <EquipmentReturnDialog
        assignment={returnAssignment}
        staff={staff}
        onClose={() => setReturnAssignment(null)}
      />
    </section>
  );

  function renderItems() {
    if (isLoadingItems) {
      return <StatusBox>Loading equipment…</StatusBox>;
    }
    if (itemsError) {
      return <StatusBox error>Equipment could not be loaded.</StatusBox>;
    }
    return <EquipmentItemList items={items} onEdit={openItem} />;
  }

  function renderAssignments() {
    if (isLoadingAssignments) {
      return <StatusBox>Loading assignments…</StatusBox>;
    }
    if (assignmentsError) {
      return <StatusBox error>Assignments could not be loaded.</StatusBox>;
    }
    return (
      <EquipmentAssignmentList
        assignments={assignments}
        cancellingId={cancellingId}
        onRelease={setReleaseAssignment}
        onReturn={setReturnAssignment}
        onCancel={(assignment) => void handleCancelAssignment(assignment)}
      />
    );
  }
}

function Summary({ label, value, warn = false }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className={warn ? 'equipment-summary-value equipment-summary-warn' : 'equipment-summary-value'}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusBox({ children, error = false }: { children: string; error?: boolean }) {
  return (
    <div
      className={error ? 'equipment-status-box equipment-status-box-error' : 'equipment-status-box'}
      role={error ? 'alert' : 'status'}
    >
      {children}
    </div>
  );
}
