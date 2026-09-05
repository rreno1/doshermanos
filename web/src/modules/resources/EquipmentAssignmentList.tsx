import type { EquipmentAssignment } from './equipment.types';

type Props = {
  assignments: EquipmentAssignment[];
  onRelease: (assignment: EquipmentAssignment) => void;
  onReturn: (assignment: EquipmentAssignment) => void;
  onCancel: (assignment: EquipmentAssignment) => void;
  cancellingId: string | null;
};

export function EquipmentAssignmentList({
  assignments,
  onRelease,
  onReturn,
  onCancel,
  cancellingId,
}: Props) {
  if (assignments.length === 0) {
    return <div className="management-empty-state">No assignments match the current view.</div>;
  }

  return (
    <div className="management-table-wrap">
      <table className="management-table">
        <thead>
          <tr>
            <th scope="col" className="col-primary">Equipment</th>
            <th scope="col" className="col-secondary">Reservation</th>
            <th scope="col" className="col-secondary">Event</th>
            <th scope="col" className="col-secondary col-hide-mobile">Quantity</th>
            <th scope="col" className="col-hide-tablet">Return result</th>
            <th scope="col" className="col-status">Status</th>
            <th scope="col" className="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((assignment) => (
            <tr key={assignment.id}>
              <td className="col-primary">
                <div className="management-table-primary">
                  <strong>{assignment.equipmentName}</strong>
                  <span>{assignment.note || assignment.unit}</span>
                </div>
              </td>
              <td className="col-secondary">{assignment.packageName}</td>
              <td className="col-secondary">{formatEventRange(assignment)}</td>
              <td className="col-secondary col-hide-mobile">{assignment.assignedQuantity.toLocaleString('en-PH')} {assignment.unit}</td>
              <td className="col-hide-tablet">{formatReturnResult(assignment)}</td>
              <td className="col-status"><StatusBadge status={assignment.status} /></td>
              <td className="col-actions">
                <div className="management-table-actions">
                  {assignment.status === 'assigned' ? (
                    <>
                      <button type="button" className="management-primary-button" onClick={() => onRelease(assignment)}>
                        Release
                      </button>
                      <button
                        type="button"
                        className="management-row-button"
                        disabled={cancellingId === assignment.id}
                        onClick={() => onCancel(assignment)}
                      >
                        {cancellingId === assignment.id ? 'Cancelling…' : 'Cancel'}
                      </button>
                    </>
                  ) : null}
                  {assignment.status === 'released' ? (
                    <button type="button" className="management-primary-button" onClick={() => onReturn(assignment)}>
                      Receive return
                    </button>
                  ) : null}
                  {assignment.status === 'closed' || assignment.status === 'cancelled' ? (
                    <span className="management-table-muted">No action</span>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: EquipmentAssignment['status'] }) {
  const labels = {
    assigned: 'Assigned',
    released: 'Released',
    closed: 'Closed',
    cancelled: 'Cancelled',
  } as const;
  const classes = {
    assigned: 'management-status-badge management-status-badge-active',
    released: 'management-status-badge management-status-badge-warn',
    closed: 'management-status-badge management-status-badge-good',
    cancelled: 'management-status-badge management-status-badge-muted',
  } as const;

  return <span className={classes[status]}>{labels[status]}</span>;
}

function formatReturnResult(assignment: EquipmentAssignment) {
  if (assignment.status !== 'closed') {
    return '—';
  }

  const result = `${assignment.returnedGoodQuantity} usable`;
  const issues = assignment.damagedQuantity + assignment.missingQuantity;
  return issues === 0 ? result : `${result} · ${assignment.damagedQuantity} damaged · ${assignment.missingQuantity} missing`;
}

function formatEventRange(assignment: EquipmentAssignment): string {
  const formatter = new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
  const start = formatter.format(assignment.eventStartDate);
  const end = formatter.format(assignment.eventEndDate);

  return start === end ? start : `${start} – ${end}`;
}
