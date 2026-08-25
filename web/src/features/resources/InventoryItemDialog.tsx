import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useToast } from '../../app/ToastProvider';
import {
  ResourceImagePicker,
  useResourceImageDraft,
} from './ResourceImagePicker';
import {
  getResourceImageErrorMessage,
  removeResourceImage,
  uploadResourceImage,
} from './resource-image.service';
import {
  createInventoryItem,
  getInventoryErrorMessage,
  touchInventoryItem,
  updateInventoryItemDetails,
} from './inventory.service';
import type { InventoryItem } from './inventory.types';
import { validateInventoryItemDetails } from './inventory.validation';
import './inventory-dialog.css';

type InventoryItemDialogProps = {
  isOpen: boolean;
  item: InventoryItem | null;
  onClose: () => void;
};

export function InventoryItemDialog({ isOpen, item, onClose }: InventoryItemDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
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
      {isOpen ? <InventoryItemForm key={item?.id ?? 'new'} item={item} onClose={onClose} /> : null}
    </dialog>
  );
}

function InventoryItemForm({ item, onClose }: { item: InventoryItem | null; onClose: () => void }) {
  const { showToast } = useToast();
  const [name, setName] = useState(item?.name ?? '');
  const [unit, setUnit] = useState(item?.unit ?? '');
  const [lowStockThreshold, setLowStockThreshold] = useState(String(item?.lowStockThreshold ?? 0));
  const [isActive, setIsActive] = useState(item?.isActive ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const imageDraft = useResourceImageDraft('inventory', item?.id ?? null);
  const isEditing = item !== null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const validation = validateInventoryItemDetails(name, unit, lowStockThreshold, isActive);
    if (!validation.value) {
      setMessage(validation.message);
      return;
    }

    setIsSaving(true);
    let inventoryItemId = item?.id ?? null;

    try {
      if (item) {
        await updateInventoryItemDetails(item.id, validation.value);
      } else {
        inventoryItemId = await createInventoryItem(validation.value);
      }

      if (!inventoryItemId) {
        throw new Error('Inventory item identifier is unavailable.');
      }

      if (imageDraft.file) {
        try {
          await uploadResourceImage('inventory', inventoryItemId, imageDraft.file);
          await touchInventoryItem(inventoryItemId);
        } catch (error) {
          setMessage(getResourceImageErrorMessage(error));
          return;
        }
      } else if (imageDraft.removeExisting) {
        try {
          await removeResourceImage('inventory', inventoryItemId);
          await touchInventoryItem(inventoryItemId);
        } catch (error) {
          setMessage(getResourceImageErrorMessage(error));
          return;
        }
      }

      showToast({
        message: item ? 'Inventory item updated.' : 'Inventory item created.',
        tone: 'success',
      });
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
          <p className="inventory-kicker">{isEditing ? 'Inventory settings' : 'New inventory item'}</p>
          <h3 id="inventory-item-dialog-title">{isEditing ? 'Edit item' : 'Track another item'}</h3>
        </div>
        <button className="inventory-close-button" type="button" aria-label="Close inventory item form" onClick={onClose}>×</button>
      </div>

      <ResourceImagePicker
        draft={imageDraft}
        label="Item image"
        onError={setMessage}
      />

      <label className="inventory-field">
        <span>Item name</span>
        <input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required autoFocus />
      </label>

      <label className="inventory-field">
        <span>Tracking unit</span>
        <input value={unit} onChange={(event) => setUnit(event.target.value)} maxLength={40} placeholder="pieces, grams, bottles" required />
        <small>Use the smallest whole-number unit you normally count.</small>
      </label>

      <label className="inventory-field">
        <span>Low-stock threshold</span>
        <input type="number" inputMode="numeric" min="0" max="100000000" step="1" value={lowStockThreshold} onChange={(event) => setLowStockThreshold(event.target.value)} required />
      </label>

      {isEditing ? (
        <label className="inventory-checkbox-field">
          <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
          <span>
            <strong>Active item</strong>
            <small>Inactive items stay in history but cannot receive stock changes.</small>
          </span>
        </label>
      ) : null}

      {message ? <div className="inventory-message inventory-message-error" role="alert">{message}</div> : null}

      <div className="inventory-dialog-actions">
        <button type="button" className="inventory-secondary-button" onClick={onClose}>Cancel</button>
        <button type="submit" className="inventory-primary-button" disabled={isSaving}>
          {isSaving ? 'Saving item…' : isEditing ? 'Save item' : 'Create item'}
        </button>
      </div>
    </form>
  );
}
