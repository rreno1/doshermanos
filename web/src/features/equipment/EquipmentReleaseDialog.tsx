import { useEffect, useRef, useState } from 'react';
import { releaseEquipmentAssignment } from './equipment.service';
import type { EquipmentAssignment, StaffIdentity } from './equipment.types';
import './equipment-dialog.css';

type Props = {
  assignment: EquipmentAssignment | null;
  staff: StaffIdentity;
  onClose: () => void;
};

export function EquipmentReleaseDialog({ assignment, staff, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (assignment && !dialog.open) {
      setErrorMessage(null);
      dialog.showModal();
    } else if (!assignment && dialog.open) {
      dialog.close();
    }
  }, [assignment]);

  async function handleRelease() {
    if (!assignment) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await releaseEquipmentAssignment(assignment.id, staff);
      onClose();
    } catch {
      setErrorMessage('This equipment could not be released. Check current availability and try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="equipment-dialog equipment-dialog-small"
      aria-labelledby="equipment-release-dialog-title"
      onClose={onClose}
    >
      <div className="equipment-dialog-panel">
        <div className="equipment-dialog-heading">
          <div>
            <p className="equipment-kicker">Physical release</p>
            <h3 id="equipment-release-dialog-title">Release equipment?</h3>
            <p className="equipment-dialog-copy">
              {assignment
                ? `${assignment.assignedQuantity} ${assignment.unit} of ${assignment.equipmentName} will be marked in use for ${assignment.packageName}.`
                : 'Confirm the physical release.'}
            </p>
          </div>
          <button
            type="button"
            className="equipment-close-button"
            aria-label="Close equipment release confirmation"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <p className="equipment-dialog-copy">
          The release succeeds only if enough units are currently available. It also creates an immutable accountability transaction.
        </p>

        {errorMessage ? (
          <p className="equipment-message equipment-message-error" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <div className="equipment-dialog-actions">
          <button type="button" className="equipment-secondary-button" onClick={onClose}>
            Not yet
          </button>
          <button
            type="button"
            className="equipment-primary-button"
            disabled={isSaving || !assignment}
            onClick={() => void handleRelease()}
          >
            {isSaving ? 'Releasing…' : 'Confirm release'}
          </button>
        </div>
      </div>
    </dialog>
  );
}
