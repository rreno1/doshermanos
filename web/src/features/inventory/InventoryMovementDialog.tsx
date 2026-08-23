import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  getInventoryErrorMessage,
  recordInventoryMovement,
} from './inventory.service';
import type { InventoryItem, InventoryMovementType } from './inventory.types';
import { validateInventoryMovement } from './inventory.validation';
import './inventory-dialog.css';

type InventoryMovementDialogProps = {
  item: InventoryItem | null;
  recordedBy: string;
  recordedByName: string;
  onClose: () => void;
};

export function InventoryMovementDialog({
  item,
  recordedBy,
  recordedByName,
  onClose,
}: InventoryMovementDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (item && !dialog?.open) {
      dialog?.showModal();
    }

    if (!item && dialog?.open) {
      dialog.close();
    }
  }, [item]);

  return (
    <dialog
      ref={dialogRef}
      className="inventory-dialog"
      aria-labelledby="inventory-movement-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
    >
      {item ? (
        <InventoryMovementForm
          item={item}
          recordedBy={recordedBy}
          recordedByName={recordedByName}
          onClose={onClose}
        />
      ) : null}
    </dialog>
  );
}

function InventoryMovementForm({
  item,
  recordedBy,
  recordedByName,
  onClose,
}: {
  item: InventoryItem;
  recordedBy: string;
  recordedByName: string;
  onClose: () => void;
}) {
  const [type, setType] = useState<InventoryMovementType>('stock_in');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const validation = validateInventoryMovement(type, quantity, note);

    if (!validation.value) {
      setMessage(validation.message);
      return;
    }

    setIsSaving(true);

    try {
      await recordInventoryMovement(
        item.id,
        validation.value,
        recordedBy,
        recordedByName,
      );
      onClose();
    } catch (error) {
      setMessage(getInventoryErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  const quantityLabel = type === 'correction' ? 'Actual quantity' : 'Quantity';

  return (
    <form className="inventory-dialog-panel" onSubmit={handleSubmit}>
      <div className="inventory-dialog-heading">
        <div>
          <p className="inventory-kicker">{item.name}</p>
          <h3 id="inventory-movement-dialog-title">Update stock</h3>
          <p className="inventory-dialog-copy">
            Current stock: <strong>{item.quantity} {item.unit}</strong>
          </p>
        </div>
        <button
          className="inventory-close-button"
          type="button"
          aria-label="Close stock update form"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <fieldset className="inventory-movement-options">
        <legend>Stock action</legend>
        <MovementOption
          label="Add stock"
          value="stock_in"
          currentValue={type}
          onChange={setType}
        />
        <MovementOption
          label="Remove stock"
          value="stock_out"
          currentValue={type}
          onChange={setType}
        />
        <MovementOption
          label="Correct count"
          value="correction"
          currentValue={type}
          onChange={setType}
        />
      </fieldset>

      <label className="inventory-field">
        <span>{quantityLabel}</span>
        <input
          type="number"
          inputMode="numeric"
          min={type === 'correction' ? '0' : '1'}
          max="100000000"
          step="1"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          required
          autoFocus
        />
      </label>

      <label className="inventory-field">
        <span>{type === 'correction' ? 'Correction note' : 'Note (optional)'}</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={300}
          rows={3}
          placeholder={
            type === 'correction'
              ? 'Explain why the recorded count changed.'
              : 'Delivery, kitchen use, event preparation, or other context.'
          }
          required={type === 'correction'}
        />
      </label>

      {message ? (
        <div className="inventory-message inventory-message-error" role="alert">
          {message}
        </div>
      ) : null}

      <div className="inventory-dialog-actions">
        <button type="button" className="inventory-secondary-button" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="inventory-primary-button" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save stock change'}
        </button>
      </div>
    </form>
  );
}

function MovementOption({
  label,
  value,
  currentValue,
  onChange,
}: {
  label: string;
  value: InventoryMovementType;
  currentValue: InventoryMovementType;
  onChange: (value: InventoryMovementType) => void;
}) {
  return (
    <label className="inventory-movement-option">
      <input
        type="radio"
        name="inventory-movement-type"
        value={value}
        checked={currentValue === value}
        onChange={() => onChange(value)}
      />
      <span>{label}</span>
    </label>
  );
}
