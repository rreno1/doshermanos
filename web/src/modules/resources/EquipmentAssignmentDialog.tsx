import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ManagementLoadingState, ManagementSelect } from '../../app/ManagementControls';
import { useToast } from '../../app/ToastProvider';
import {
  createEquipmentAssignment,
  loadAssignableReservations,
} from './equipment.service';
import type {
  AssignableReservation,
  EquipmentItem,
  StaffIdentity,
} from './equipment.types';
import { validateEquipmentAssignment } from './equipment.validation';
import './equipment-dialog.css';

type Props = {
  isOpen: boolean;
  equipment: EquipmentItem[];
  staff: StaffIdentity;
  onClose: () => void;
};

export function EquipmentAssignmentDialog({
  isOpen,
  equipment,
  staff,
  onClose,
}: Props) {
  const { showToast } = useToast();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [reservations, setReservations] = useState<AssignableReservation[]>([]);
  const [reservationId, setReservationId] = useState('');
  const [equipmentId, setEquipmentId] = useState('');
  const [assignedQuantity, setAssignedQuantity] = useState('1');
  const [note, setNote] = useState('');
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeEquipment = useMemo(
    () => equipment.filter((item) => item.isActive),
    [equipment],
  );
  const selectedEquipment = activeEquipment.find((item) => item.id === equipmentId) ?? null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    setReservationId('');
    setEquipmentId('');
    setAssignedQuantity('1');
    setNote('');
    setErrorMessage(null);
    setIsLoadingReservations(true);

    let isCurrent = true;
    void loadAssignableReservations()
      .then((nextReservations) => {
        if (isCurrent) setReservations(nextReservations);
      })
      .catch(() => {
        if (isCurrent) {
          setReservations([]);
          setErrorMessage('We could not load reservations for equipment assignment.');
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoadingReservations(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [isOpen]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const quantity = Number(assignedQuantity);
    const input = { reservationId, equipmentId, assignedQuantity: quantity, note };
    const validationError = validateEquipmentAssignment(input);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    if (!selectedEquipment || quantity > selectedEquipment.totalQuantity) {
      setErrorMessage('Assigned quantity cannot exceed the registered equipment quantity.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await createEquipmentAssignment(input, staff);
      showToast({ message: 'Equipment assigned to event.', tone: 'success' });
      onClose();
    } catch {
      setErrorMessage('We could not create this equipment assignment. Please review the reservation and try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="equipment-dialog"
      aria-labelledby="equipment-assignment-dialog-title"
      onClose={onClose}
    >
      <form className="equipment-dialog-panel" onSubmit={handleSubmit}>
        <div className="equipment-dialog-heading">
          <div>
            <p className="equipment-kicker">Event equipment</p>
            <h3 id="equipment-assignment-dialog-title">Assign equipment</h3>
            <p className="equipment-dialog-copy">
              Plan equipment for a reservation. Physical availability is checked again when staff actually releases the equipment.
            </p>
          </div>
          <button type="button" className="equipment-close-button" aria-label="Close equipment assignment form" onClick={onClose}>×</button>
        </div>

        {isLoadingReservations ? (
          <ManagementLoadingState message="Loading reservations for assignment…" />
        ) : (
          <>
            <div className="equipment-field">
              <span>Reservation</span>
              <ManagementSelect
                value={reservationId}
                options={[
                  { value: '', label: 'Choose a reservation' },
                  ...reservations.map((reservation) => ({
                    value: reservation.id,
                    label: `${reservation.packageName} · ${formatEventRange(reservation)}`,
                  })),
                ]}
                onChange={setReservationId}
                ariaLabel="Reservation for equipment assignment"
              />
              <small>Pending-review and confirmed reservations can be prepared.</small>
            </div>

            <div className="equipment-field">
              <span>Equipment</span>
              <ManagementSelect
                value={equipmentId}
                options={[
                  { value: '', label: 'Choose equipment' },
                  ...activeEquipment.map((item) => ({
                    value: item.id,
                    label: `${item.name} · ${item.availableQuantity} available / ${item.totalQuantity} total`,
                  })),
                ]}
                onChange={setEquipmentId}
                ariaLabel="Equipment to assign"
              />
            </div>

            <label className="equipment-field">
              Assigned quantity
              <input
                type="number"
                min="1"
                max={selectedEquipment?.totalQuantity ?? 1000000}
                step="1"
                inputMode="numeric"
                value={assignedQuantity}
                onChange={(event) => setAssignedQuantity(event.target.value)}
              />
              {selectedEquipment ? (
                <small>
                  Registered as {selectedEquipment.totalQuantity} {selectedEquipment.unit}; currently {selectedEquipment.availableQuantity} available for release.
                </small>
              ) : null}
            </label>

            <label className="equipment-field">
              Assignment note <span className="equipment-optional">Optional</span>
              <textarea
                rows={3}
                maxLength={500}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Placement, handling, or event-specific instructions"
              />
            </label>
          </>
        )}

        {errorMessage ? <p className="equipment-message equipment-message-error" role="alert">{errorMessage}</p> : null}

        <div className="equipment-dialog-actions">
          <button type="button" className="equipment-secondary-button" onClick={onClose}>Cancel</button>
          <button type="submit" className="equipment-primary-button" disabled={isSaving || isLoadingReservations || activeEquipment.length === 0}>
            {isSaving ? 'Assigning…' : 'Assign equipment'}
          </button>
        </div>
      </form>
    </dialog>
  );
}

function formatEventRange(reservation: AssignableReservation): string {
  const formatter = new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
  const start = formatter.format(reservation.eventStartDate);
  const end = formatter.format(reservation.eventEndDate);
  return start === end ? start : `${start} – ${end}`;
}
