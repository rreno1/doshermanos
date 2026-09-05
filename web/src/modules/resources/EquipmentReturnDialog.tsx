import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useToast } from '@shared/ui/ToastProvider';
import { returnEquipmentAssignment } from './equipment.service';
import type { EquipmentAssignment, StaffIdentity } from './equipment.types';
import { validateEquipmentReturn } from './equipment.validation';
import './equipment-dialog.css';

type Props = {
  assignment: EquipmentAssignment | null;
  staff: StaffIdentity;
  onClose: () => void;
};

export function EquipmentReturnDialog({ assignment, staff, onClose }: Props) {
  const { showToast } = useToast();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [returnedGood, setReturnedGood] = useState('0');
  const [damaged, setDamaged] = useState('0');
  const [missing, setMissing] = useState('0');
  const [returnNote, setReturnNote] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (assignment && !dialog.open) dialog.showModal();
    else if (!assignment && dialog.open) dialog.close();
  }, [assignment]);

  useEffect(() => {
    if (!assignment) return;
    setReturnedGood(String(assignment.assignedQuantity));
    setDamaged('0');
    setMissing('0');
    setReturnNote('');
    setErrorMessage(null);
  }, [assignment]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!assignment) return;

    const input = {
      returnedGoodQuantity: Number(returnedGood),
      damagedQuantity: Number(damaged),
      missingQuantity: Number(missing),
      returnNote,
    };
    const validationError = validateEquipmentReturn(input, assignment.assignedQuantity);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    try {
      await returnEquipmentAssignment(assignment.id, input, staff);
      showToast({ message: 'Equipment return recorded.', tone: input.damagedQuantity > 0 || input.missingQuantity > 0 ? 'warning' : 'success' });
      onClose();
    } catch {
      setErrorMessage('We could not close this equipment return. Please review the quantities and try again.');
    } finally {
      setIsSaving(false);
    }
  }

  const accountedQuantity = Number(returnedGood) + Number(damaged) + Number(missing);

  return (
    <dialog ref={dialogRef} className="equipment-dialog" aria-labelledby="equipment-return-dialog-title" onClose={onClose}>
      <form className="equipment-dialog-panel" onSubmit={handleSubmit}>
        <div className="equipment-dialog-heading">
          <div>
            <p className="equipment-kicker">Return accountability</p>
            <h3 id="equipment-return-dialog-title">Receive equipment</h3>
            <p className="equipment-dialog-copy">
              {assignment
                ? `${assignment.assignedQuantity} ${assignment.unit} of ${assignment.equipmentName} were released for ${assignment.packageName}.`
                : 'Account for all released equipment.'}
            </p>
          </div>
          <button type="button" className="equipment-close-button" aria-label="Close equipment return form" onClick={onClose}>×</button>
        </div>

        <div className="equipment-return-grid">
          <QuantityField label="Returned usable" value={returnedGood} onChange={setReturnedGood} />
          <QuantityField label="Damaged" value={damaged} onChange={setDamaged} />
          <QuantityField label="Missing" value={missing} onChange={setMissing} />
        </div>

        <p className={assignment && accountedQuantity === assignment.assignedQuantity ? 'equipment-accounted equipment-accounted-complete' : 'equipment-accounted'} aria-live="polite">
          Accounted: {Number.isFinite(accountedQuantity) ? accountedQuantity : 0} / {assignment?.assignedQuantity ?? 0}
        </p>

        <label className="equipment-field">
          Return note <span className="equipment-optional">Required for damaged or missing items</span>
          <textarea rows={4} maxLength={500} value={returnNote} onChange={(event) => setReturnNote(event.target.value)} placeholder="Describe damage, missing items, or other return details" />
        </label>

        {errorMessage ? <p className="equipment-message equipment-message-error" role="alert">{errorMessage}</p> : null}

        <div className="equipment-dialog-actions">
          <button type="button" className="equipment-secondary-button" onClick={onClose}>Cancel</button>
          <button type="submit" className="equipment-primary-button" disabled={isSaving || !assignment}>{isSaving ? 'Recording…' : 'Record return'}</button>
        </div>
      </form>
    </dialog>
  );
}

function QuantityField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="equipment-field">
      {label}
      <input type="number" min="0" max="1000000" step="1" inputMode="numeric" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
