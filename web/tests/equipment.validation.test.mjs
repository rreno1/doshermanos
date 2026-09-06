import assert from 'node:assert/strict';
import test from 'node:test';
import {
  validateEquipmentAssignment,
  validateEquipmentItem,
  validateEquipmentReturn,
} from '../src/modules/resources/equipment.validation.ts';

test('equipment item and assignment validation accepts valid whole-number quantities', () => {
  assert.equal(
    validateEquipmentItem({
      name: 'Chairs',
      unit: 'pieces',
      totalQuantity: 150,
      isActive: true,
    }),
    null,
  );

  assert.equal(
    validateEquipmentAssignment({
      reservationId: 'reservation-1',
      equipmentId: 'equipment-1',
      assignedQuantity: 80,
      note: ' Main dining area ',
    }),
    null,
  );
});

test('equipment assignment validation requires reservation, equipment, and a positive quantity', () => {
  assert.equal(
    validateEquipmentAssignment({
      reservationId: '',
      equipmentId: 'equipment-1',
      assignedQuantity: 10,
      note: '',
    }),
    'Choose a reservation.',
  );

  assert.equal(
    validateEquipmentAssignment({
      reservationId: 'reservation-1',
      equipmentId: '',
      assignedQuantity: 10,
      note: '',
    }),
    'Choose an equipment item.',
  );

  assert.equal(
    validateEquipmentAssignment({
      reservationId: 'reservation-1',
      equipmentId: 'equipment-1',
      assignedQuantity: 0,
      note: '',
    }),
    'Assigned quantity must be a whole number greater than zero.',
  );
});

test('equipment return validation requires every released unit to be reconciled', () => {
  const valid = validateEquipmentReturn(
    {
      returnedGoodQuantity: 8,
      damagedQuantity: 1,
      missingQuantity: 1,
      returnNote: 'One chair damaged and one missing.',
    },
    10,
  );

  const incomplete = validateEquipmentReturn(
    {
      returnedGoodQuantity: 8,
      damagedQuantity: 1,
      missingQuantity: 0,
      returnNote: 'One chair damaged.',
    },
    10,
  );

  assert.equal(valid, null);
  assert.equal(incomplete, 'Account for all 10 released units before closing the assignment.');
});

test('equipment return validation requires explanations for damaged or missing units', () => {
  const result = validateEquipmentReturn(
    {
      returnedGoodQuantity: 9,
      damagedQuantity: 1,
      missingQuantity: 0,
      returnNote: 'x',
    },
    10,
  );

  assert.equal(result, 'Add a short explanation when equipment is damaged or missing.');
});
