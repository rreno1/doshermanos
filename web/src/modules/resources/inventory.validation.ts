import type {
  InventoryItemDetailsInput,
  InventoryMovementInput,
  InventoryMovementType,
} from './inventory.types';

type ValidationResult<T> =
  | { value: T; message: null }
  | { value: null; message: string };

export function validateInventoryItemDetails(
  name: string,
  unit: string,
  lowStockThreshold: string,
  isActive: boolean,
): ValidationResult<InventoryItemDetailsInput> {
  const cleanName = name.trim();
  const cleanUnit = unit.trim();
  const parsedThreshold = parseWholeNumber(lowStockThreshold);

  if (cleanName.length < 2 || cleanName.length > 120) {
    return invalid('Enter an item name between 2 and 120 characters.');
  }

  if (cleanUnit.length < 1 || cleanUnit.length > 40) {
    return invalid('Enter the whole-number unit used to track this item.');
  }

  if (parsedThreshold === null || parsedThreshold < 0) {
    return invalid('Low-stock threshold must be a whole number of zero or more.');
  }

  if (parsedThreshold > 100000000) {
    return invalid('Low-stock threshold is too large.');
  }

  return {
    value: {
      name: cleanName,
      unit: cleanUnit,
      lowStockThreshold: parsedThreshold,
      isActive,
    },
    message: null,
  };
}

export function validateInventoryMovement(
  type: InventoryMovementType,
  quantity: string,
  note: string,
): ValidationResult<InventoryMovementInput> {
  const parsedQuantity = parseWholeNumber(quantity);
  const cleanNote = note.trim();

  if (parsedQuantity === null) {
    return invalid('Enter a whole-number quantity.');
  }

  if (type === 'correction' && parsedQuantity < 0) {
    return invalid('Actual quantity cannot be negative.');
  }

  if (type !== 'correction' && parsedQuantity <= 0) {
    return invalid('Quantity must be greater than zero.');
  }

  if (parsedQuantity > 100000000) {
    return invalid('Quantity is too large.');
  }

  if (cleanNote.length > 300) {
    return invalid('Note must be 300 characters or fewer.');
  }

  if (type === 'correction' && cleanNote.length < 3) {
    return invalid('Add a short note explaining the stock correction.');
  }

  return {
    value: {
      type,
      quantity: parsedQuantity,
      note: cleanNote,
    },
    message: null,
  };
}

function parseWholeNumber(value: string): number | null {
  const cleanValue = value.trim();

  if (!/^\d+$/.test(cleanValue)) {
    return null;
  }

  const parsedValue = Number(cleanValue);

  if (!Number.isSafeInteger(parsedValue)) {
    return null;
  }

  return parsedValue;
}

function invalid<T>(message: string): ValidationResult<T> {
  return { value: null, message };
}
