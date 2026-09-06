import type {
  EquipmentAssignmentInput,
  EquipmentItemInput,
  EquipmentReturnInput,
} from './equipment.types';

const maximumQuantity = 1_000_000;

export function validateEquipmentItem(input: EquipmentItemInput): string | null {
  const name = input.name.trim();
  const unit = input.unit.trim();

  if (name.length === 0 || name.length > 120) {
    return 'Enter an equipment name with 1 to 120 characters.';
  }

  if (unit.length === 0 || unit.length > 40) {
    return 'Enter a counting unit with 1 to 40 characters.';
  }

  if (!Number.isInteger(input.totalQuantity) || input.totalQuantity <= 0) {
    return 'Total quantity must be a whole number greater than zero.';
  }

  if (input.totalQuantity > maximumQuantity) {
    return 'Total quantity is too large.';
  }

  return null;
}

export function validateEquipmentAssignment(
  input: EquipmentAssignmentInput,
): string | null {
  if (!input.reservationId) {
    return 'Choose a reservation.';
  }

  if (!input.equipmentId) {
    return 'Choose an equipment item.';
  }

  if (!Number.isInteger(input.assignedQuantity) || input.assignedQuantity <= 0) {
    return 'Assigned quantity must be a whole number greater than zero.';
  }

  if (input.assignedQuantity > maximumQuantity) {
    return 'Assigned quantity is too large.';
  }

  if (input.note.trim().length > 500) {
    return 'Assignment note must be 500 characters or fewer.';
  }

  return null;
}

export function validateEquipmentReturn(
  input: EquipmentReturnInput,
  releasedQuantity: number,
): string | null {
  const quantities = [
    input.returnedGoodQuantity,
    input.damagedQuantity,
    input.missingQuantity,
  ];

  if (quantities.some((quantity) => !Number.isInteger(quantity) || quantity < 0)) {
    return 'Return quantities must be whole numbers of zero or more.';
  }

  const accountedQuantity = quantities.reduce((total, quantity) => total + quantity, 0);
  if (accountedQuantity !== releasedQuantity) {
    return `Account for all ${releasedQuantity} released units before closing the assignment.`;
  }

  const note = input.returnNote.trim();
  if (note.length > 500) {
    return 'Return note must be 500 characters or fewer.';
  }

  if ((input.damagedQuantity > 0 || input.missingQuantity > 0) && note.length < 3) {
    return 'Add a short explanation when equipment is damaged or missing.';
  }

  return null;
}
