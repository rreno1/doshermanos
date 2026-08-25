import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { useToast } from '../../app/ToastProvider';
import {
  getInventoryImageUrl,
  removeInventoryImage,
  uploadInventoryImage,
  validateInventoryImage,
} from './inventory-image.service';
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
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(item?.name ?? '');
  const [unit, setUnit] = useState(item?.unit ?? '');
  const [lowStockThreshold, setLowStockThreshold] = useState(String(item?.lowStockThreshold ?? 0));
  const [isActive, setIsActive] = useState(item?.isActive ?? true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [storedImageUrl, setStoredImageUrl] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(Boolean(item));
  const [removeImage, setRemoveImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const isEditing = item !== null;
  const previewUrl = useImagePreview(imageFile);
  const displayedImageUrl = previewUrl ?? (removeImage ? null : storedImageUrl);

  useEffect(() => {
    if (!item) return;

    let isCurrent = true;
    setIsLoadingImage(true);

    getInventoryImageUrl(item.id)
      .then((url) => {
        if (isCurrent) setStoredImageUrl(url);
      })
      .catch(() => {
        if (isCurrent) setStoredImageUrl(null);
      })
      .finally(() => {
        if (isCurrent) setIsLoadingImage(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [item]);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';

    if (!file) return;

    const imageError = validateInventoryImage(file);
    if (imageError) {
      setMessage(imageError);
      return;
    }

    setMessage(null);
    setImageFile(file);
    setRemoveImage(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const validation = validateInventoryItemDetails(name, unit, lowStockThreshold, isActive);
    if (!validation.value) {
      setMessage(validation.message);
      return;
    }

    setIsSaving(true);

    try {
      const inventoryItemId = item
        ? item.id
        : await createInventoryItem(validation.value);

      if (item) {
        await updateInventoryItemDetails(item.id, validation.value);
      }

      const imageChanged = imageFile !== null || removeImage;
      if (imageFile) {
        await uploadInventoryImage(inventoryItemId, imageFile);
      } else if (removeImage) {
        await removeInventoryImage(inventoryItemId);
      }

      if (imageChanged) {
        await touchInventoryItem(inventoryItemId);
      }

      showToast({
        message: item ? 'Inventory item updated.' : 'Inventory item created.',
        tone: 'success',
      });
      onClose();
    } catch (error) {
      if (!item && imageFile) {
        showToast({
          message: 'The item may have been created without its image. You can add the image by editing the item.',
          tone: 'warning',
        });
      }
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

      <div className="inventory-image-field">
        <span className="inventory-image-field-label">Item image</span>
        <div className="inventory-image-preview">
          {displayedImageUrl ? (
            <img src={displayedImageUrl} alt="Selected inventory item preview" />
          ) : isLoadingImage ? (
            <div className="inventory-image-preview-empty">
              <span className="management-spinner" aria-hidden="true" />
              <span>Loading image…</span>
            </div>
          ) : (
            <div className="inventory-image-preview-empty">
              <InventoryImageIcon />
              <span>No image selected</span>
            </div>
          )}
        </div>
        <input
          ref={imageInputRef}
          className="inventory-image-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageChange}
        />
        <div className="inventory-image-actions">
          <button
            type="button"
            className="management-secondary-button"
            onClick={() => imageInputRef.current?.click()}
          >
            {displayedImageUrl ? 'Replace image' : 'Choose image'}
          </button>
          {displayedImageUrl ? (
            <button
              type="button"
              className="management-row-button"
              onClick={() => {
                setImageFile(null);
                setRemoveImage(true);
              }}
            >
              Remove
            </button>
          ) : null}
        </div>
        <small>JPEG, PNG, or WebP. Maximum file size: 5 MB.</small>
      </div>

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

function useImagePreview(file: File | null) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  return previewUrl;
}

function InventoryImageIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect x="8" y="10" width="32" height="28" rx="4" />
      <circle cx="18" cy="20" r="3" />
      <path d="m12 34 9-9 6 6 4-4 5 7" />
    </svg>
  );
}
