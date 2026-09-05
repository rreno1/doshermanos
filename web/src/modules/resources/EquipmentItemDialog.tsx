import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useToast } from '@core/app/ToastProvider';
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
  createEquipmentItem,
  deleteEquipmentItem,
  touchEquipmentItem,
  updateEquipmentItem,
} from './equipment.registry.service';
import type { EquipmentItem } from './equipment.types';
import { validateEquipmentItem } from './equipment.validation';
import './equipment-dialog.css';

type Props = {
  isOpen: boolean;
  item: EquipmentItem | null;
  onClose: () => void;
};

export function EquipmentItemDialog({ isOpen, item, onClose }: Props) {
  const { showToast } = useToast();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('pieces');
  const [totalQuantity, setTotalQuantity] = useState('1');
  const [isActive, setIsActive] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [createdEquipmentId, setCreatedEquipmentId] = useState<string | null>(null);
  const imageDraft = useResourceImageDraft('equipment', item?.id ?? null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setName(item?.name ?? '');
    setUnit(item?.unit ?? 'pieces');
    setTotalQuantity(String(item?.totalQuantity ?? 1));
    setIsActive(item?.isActive ?? true);
    setErrorMessage(null);
    setIsDeleting(false);
    setCreatedEquipmentId(null);
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

    const unavailableQuantity = item ? item.inUseQuantity + item.damagedQuantity + item.missingQuantity : 0;
    if (item && quantity < unavailableQuantity) {
      setErrorMessage(`Total quantity cannot be lower than ${unavailableQuantity} while units are in use, damaged, or missing.`);
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    let equipmentId = item?.id ?? createdEquipmentId;
    let createdDuringSave = false;

    try {
      if (item) {
        await updateEquipmentItem(item.id, input);
      } else if (createdEquipmentId) {
        await updateEquipmentItem(createdEquipmentId, input);
      } else {
        equipmentId = await createEquipmentItem(input);
        setCreatedEquipmentId(equipmentId);
        createdDuringSave = true;
      }

      if (!equipmentId) {
        throw new Error('Equipment identifier is unavailable.');
      }

      if (imageDraft.file) {
        try {
          await uploadResourceImage('equipment', equipmentId, imageDraft.file);
          await touchEquipmentItem(equipmentId);
        } catch (error) {
          const imageMessage = getResourceImageErrorMessage(error);
          setErrorMessage(
            createdDuringSave || createdEquipmentId
              ? `The equipment details were saved, but the image was not uploaded. ${imageMessage}`
              : imageMessage,
          );
          return;
        }
      } else if (imageDraft.removeExisting) {
        try {
          await removeResourceImage('equipment', equipmentId);
          await touchEquipmentItem(equipmentId);
        } catch (error) {
          setErrorMessage(getResourceImageErrorMessage(error));
          return;
        }
      }

      showToast({ message: item ? 'Equipment updated.' : 'Equipment added.', tone: 'success' });
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Equipment could not be saved. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!item) return;

    if (item.inUseQuantity > 0) {
      setErrorMessage('Return all equipment currently in use before deleting this registry entry.');
      return;
    }

    const shouldDelete = window.confirm(`Delete ${item.name} from the equipment registry? Historical assignments and transactions will be kept.`);
    if (!shouldDelete) return;

    setIsDeleting(true);
    setErrorMessage(null);
    try {
      await deleteEquipmentItem(item.id);
      showToast({ message: 'Equipment removed from the active registry.', tone: 'success' });
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Equipment could not be deleted. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }

  const canChangeActiveStatus = !item || item.inUseQuantity === 0;
  const minimumTotalQuantity = item ? Math.max(1, item.inUseQuantity + item.damagedQuantity + item.missingQuantity) : 1;
  const isBusy = isSaving || isDeleting;

  return (
    <dialog
      ref={dialogRef}
      className="equipment-dialog"
      aria-labelledby="equipment-item-dialog-title"
      onCancel={(event) => {
        if (isBusy) event.preventDefault();
      }}
      onClose={onClose}
    >
      <form className="equipment-dialog-panel" onSubmit={handleSubmit}>
        <div className="equipment-dialog-heading">
          <div>
            <h3 id="equipment-item-dialog-title">{item ? 'Edit equipment' : 'Add equipment'}</h3>
            <p className="equipment-dialog-copy">
              {item
                ? 'Update the registry details. Quantity changes adjust the available count while preserving in-use, damaged, and missing units.'
                : 'Register equipment and its current physical quantity.'}
            </p>
          </div>
          <button type="button" className="equipment-close-button" aria-label="Close equipment form" onClick={onClose} disabled={isBusy}>×</button>
        </div>

        <ResourceImagePicker
          draft={imageDraft}
          label="Equipment image"
          onError={setErrorMessage}
        />

        <label className="equipment-field">
          Equipment name
          <input value={name} maxLength={120} autoComplete="off" onChange={(event) => setName(event.target.value)} />
        </label>

        <div className="equipment-field-row">
          <label className="equipment-field">
            Counting unit
            <input value={unit} maxLength={40} onChange={(event) => setUnit(event.target.value)} />
            <small>Examples: pieces, tables, chairs.</small>
          </label>
          <label className="equipment-field">
            Total quantity
            <input type="number" min={minimumTotalQuantity} max="1000000" step="1" inputMode="numeric" value={totalQuantity} onChange={(event) => setTotalQuantity(event.target.value)} />
            {item ? <small>Minimum {minimumTotalQuantity} based on units already in use, damaged, or missing.</small> : null}
          </label>
        </div>

        <label className="equipment-check-field">
          <input type="checkbox" checked={isActive} disabled={!canChangeActiveStatus} onChange={(event) => setIsActive(event.target.checked)} />
          <span>
            <strong>Active equipment</strong>
            <small>
              {canChangeActiveStatus
                ? 'Inactive equipment remains in the registry but cannot be assigned or released.'
                : 'Equipment currently in use must stay active until it is returned.'}
            </small>
          </span>
        </label>

        {errorMessage ? <p className="equipment-message equipment-message-error" role="alert">{errorMessage}</p> : null}

        <div className={`equipment-dialog-actions${item ? ' equipment-dialog-actions-edit' : ''}`}>
          {item ? (
            <button
              type="button"
              className="equipment-delete-button"
              disabled={isBusy || item.inUseQuantity > 0}
              title={item.inUseQuantity > 0 ? 'Return equipment currently in use before deleting it' : undefined}
              onClick={() => void handleDelete()}
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </button>
          ) : null}
          <div className="equipment-dialog-actions-main">
            <button type="button" className="equipment-secondary-button" onClick={onClose} disabled={isBusy}>Cancel</button>
            <button type="submit" className="equipment-primary-button" disabled={isBusy}>
              {isSaving ? 'Saving…' : item ? 'Save changes' : createdEquipmentId ? 'Retry image save' : 'Add equipment'}
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
