import assert from 'node:assert/strict';
import test from 'node:test';
import {
  validateInventoryItemDetails,
  validateInventoryMovement,
} from '../src/features/inventory/inventory.validation.ts';

test('inventory item validation normalizes valid details', () => {
  const result = validateInventoryItemDetails('  Rice  ', ' gram ', ' 250 ', true);

  assert.deepEqual(result, {
    value: {
      name: 'Rice',
      unit: 'gram',
      lowStockThreshold: 250,
      isActive: true,
    },
    message: null,
  });
});

test('inventory movement validation accepts positive stock changes', () => {
  const stockIn = validateInventoryMovement('stock_in', '25', ' delivered ');
  const stockOut = validateInventoryMovement('stock_out', '5', ' kitchen use ');

  assert.equal(stockIn.value?.quantity, 25);
  assert.equal(stockIn.value?.note, 'delivered');
  assert.equal(stockOut.value?.quantity, 5);
  assert.equal(stockOut.value?.note, 'kitchen use');
});

test('inventory movement validation rejects zero and fractional stock changes', () => {
  const zero = validateInventoryMovement('stock_out', '0', '');
  const fractional = validateInventoryMovement('stock_in', '1.5', '');

  assert.equal(zero.value, null);
  assert.equal(zero.message, 'Quantity must be greater than zero.');
  assert.equal(fractional.value, null);
  assert.equal(fractional.message, 'Enter a whole-number quantity.');
});

test('inventory correction requires an explanatory note and allows a zero actual count', () => {
  const missingNote = validateInventoryMovement('correction', '0', 'x');
  const validCorrection = validateInventoryMovement('correction', '0', 'count verified');

  assert.equal(missingNote.value, null);
  assert.equal(missingNote.message, 'Add a short note explaining the stock correction.');
  assert.equal(validCorrection.value?.quantity, 0);
  assert.equal(validCorrection.value?.note, 'count verified');
});
