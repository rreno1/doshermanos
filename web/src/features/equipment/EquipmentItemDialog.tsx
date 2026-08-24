import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createEquipmentItem, updateEquipmentItem } from './equipment.service';
import type { EquipmentItem } from './equipment.types';
import { validateEquipmentItem } from './equipment.validation';
import './equipment-dialog.css';

type Props = {
  isOpen: boolean;
  item: EquipmentItem | null;
  onClose: () => void;
  onSaved: () => void;
};

export function EquipmentItemDialog({ isOpen, item, onClose, onSaved }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('pieces');
  const [totalQuantity, setTotalQuantity] = useState('1');
  const [isActive, setIsActive] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setName(item?.name ?? '');
    setUnit(item?.unit ?? 'pieces');
    setTotalQuantity(String(item?.totalQuantity ?? 1));
    setIsActive(item?.isActive ?? true);
    setErrorMessage(null);
  }, [isOpen, item]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const quantity = Number(totalQuantity);
    const input = { name, unit, totalQuantity: quantity, isActive };
    const validationError = validateEquipmentItem(input);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      if (item) {
        await updateEquipmentItem(item.id, { name, isActive });
      } else {
        await createEquipmentItem(input);
      }
      onSaved();
      onClose();
    } catch {
      setErrorMessage('We could not save this equipment item. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  const canChangeActiveStatus = !item || item.inUseQuantity === 0;

  return (
    <dialog
      ref={dialogRef}
      className="equipment-dialog"
      aria-labelledby="equipment-item-dialog-title"
      onClose={onClose}
    >
      <form className="equipment-dialog-panel" onSubmit={handleSubmit}>
        <div className="equipment-dialog-heading">
          <div>
            <p className="equipment-kicker">Equipment registry</p>
            <h3 id="equipment-item-dialog-title">
              {item ? 'Edit equipment' : 'Add equipment'}
            </h3>
            <p className="equipment-dialog-copy">
              {item
                ? 'Names and active status can change. The original quantity and counting unit remain fixed so accountability history stays consistent.'
                : 'Register the physical quantity currently owned by Dos Hermanos.'}
            </p>
          </div>
          <button
            type="button"
            className="equipment-close-button"
            aria-label="Close equipment form"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <label className="equipment-field">
          Equipment name
          <input
            value={name}
            maxLength={120}
            autoComplete="off"
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        <div className="equipment-field-row">
          <label className="equipment-field">
            Counting unit
            <input
              value={unit}
              maxLength={40}
              disabled={Boolean(item)}
              onChange={(event) => setUnit(event.target.value)}
            />
            <small>Examples: pieces, tables, chairs.</small>
          </label>
          <label className="equipment-field">
            Total quantity
            <input
              type="number"
              min="1"
              max="1000000"
              step="1"
              inputMode="numeric"
              value={totalQuantity}
              disabled={Boolean(item)}
              onChange={(event) => setTotalQuantity(event.target.value)}
            />
          </label>
        </div>

        <label className="equipment-check-field">
          <input
            type="checkbox"
            checked={isActive}
            disabled={!canChangeActiveStatus}
            onChange={(event) => setIsActive(event.target.checked)}
          />
          <span>
            <strong>Active equipment</strong>
            <small>
              {canChangeActiveStatus
                ? 'Inactive equipment stays in history but cannot be assigned or released.'
                : 'Equipment currently in use cannot change active status.'}
            </small>
          </span>
        </label>

        {errorMessage ? (
          <p className="equipment-message equipment-message-error" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <div className="equipment-dialog-actions">
          <button type="button" className="equipment-secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="equipment-primary-button" disabled={isSaving}>
            {isSaving ? 'Saving…' : item ? 'Save changes' : 'Add equipment'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
