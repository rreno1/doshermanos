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
    return (
      <div className="equipment-status-box">
        No equipment assignments yet. Assign equipment to an event when preparation begins.
      </div>
    );
  }

  return (
    <div className="equipment-assignment-list">
      {assignments.map((assignment) => (
        <article className="equipment-assignment-card" key={assignment.id}>
          <div className="equipment-assignment-heading">
            <div>
              <p className="equipment-assignment-package">{assignment.packageName}</p>
              <h4>{assignment.equipmentName}</h4>
              <p>{formatEventRange(assignment)}</p>
            </div>
            <StatusBadge status={assignment.status} />
          </div>

          <div className="equipment-assignment-quantity">
            <strong>{assignment.assignedQuantity}</strong>
            <span>{assignment.unit} assigned</span>
          </div>

          {assignment.note ? <p className="equipment-assignment-note">{assignment.note}</p> : null}

          {assignment.status === 'closed' ? (
            <div className="equipment-return-summary" aria-label="Return result">
              <SummaryValue label="Returned" value={assignment.returnedGoodQuantity} />
              <SummaryValue label="Damaged" value={assignment.damagedQuantity} warn={assignment.damagedQuantity > 0} />
              <SummaryValue label="Missing" value={assignment.missingQuantity} warn={assignment.missingQuantity > 0} />
            </div>
          ) : null}

          {assignment.returnNote ? (
            <p className="equipment-assignment-note">Return note: {assignment.returnNote}</p>
          ) : null}

          <div className="equipment-assignment-actions">
            {assignment.status === 'assigned' ? (
              <>
                <button
                  type="button"
                  className="equipment-primary-button"
                  onClick={() => onRelease(assignment)}
                >
                  Release equipment
                </button>
                <button
                  type="button"
                  className="equipment-text-button"
                  disabled={cancellingId === assignment.id}
                  onClick={() => onCancel(assignment)}
                >
                  {cancellingId === assignment.id ? 'Cancelling…' : 'Cancel assignment'}
                </button>
              </>
            ) : null}

            {assignment.status === 'released' ? (
              <button
                type="button"
                className="equipment-primary-button"
                onClick={() => onReturn(assignment)}
              >
                Receive return
              </button>
            ) : null}
          </div>
        </article>
      ))}
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

  return (
    <span className={`equipment-assignment-status equipment-assignment-status-${status}`}>
      {labels[status]}
    </span>
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
  return (
    <div className={warn ? 'equipment-return-value equipment-return-value-warn' : 'equipment-return-value'}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
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
