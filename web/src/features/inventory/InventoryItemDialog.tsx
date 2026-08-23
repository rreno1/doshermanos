import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createInventoryItem, getInventoryErrorMessage } from './inventory.service';
import { validateNewInventoryItem } from './inventory.validation';

type InventoryItemDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function InventoryItemDialog({ isOpen, onClose }: InventoryItemDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (isOpen && !dialog.open) {
      dialog.showModal();
    }

    if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className="inventory-dialog"
      aria-labelledby="inventory-item-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
    >
      {isOpen ? <InventoryItemForm onClose={onClose} /> : null}
    </dialog>
  );
}

function InventoryItemForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('0');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const validation = validateNewInventoryItem(name, unit, lowStockThreshold);

    if (!validation.value) {
      setMessage(validation.message);
      return;
    }

    setIsSaving(true);

    try {
      await createInventoryItem(validation.value);
      onClose();
    } catch (error) {
      setMessage(getInventoryErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="inventory-dialog-panel" onSubmit={handleSubmit}>
      <div className="inventory-dialog-heading">
        <div>
          <p className="inventory-kicker">New inventory item</p>
          <h3 id="inventory-item-dialog-title">Track another item</h3>
        </div>
        <button
          className="inventory-close-button"
          type="button"
          aria-label="Close inventory item form"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <label className="inventory-field">
        <span>Item name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={120}
          required
          autoFocus
        />
      </label>

      <label className="inventory-field">
        <span>Tracking unit</span>
        <input
          value={unit}
          onChange={(event) => setUnit(event.target.value)}
          maxLength={40}
          placeholder="pieces, grams, bottles"
          required
        />
        <small>Use the smallest whole-number unit you normally count.</small>
      </label>

      <label className="inventory-field">
        <span>Low-stock threshold</span>
        <input
          type="number"
          inputMode="numeric"
          min="0"
          max="100000000"
          step="1"
          value={lowStockThreshold}
          onChange={(event) => setLowStockThreshold(event.target.value)}
          required
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
          {isSaving ? 'Saving…' : 'Create item'}
        </button>
      </div>
    </form>
  );
}
