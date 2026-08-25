import assert from 'node:assert/strict';
import test from 'node:test';
import { validateManualReservationCustomer } from '../src/features/operations/manual-reservation.validation.ts';

test('manual reservation customer validation trims valid details', () => {
  const result = validateManualReservationCustomer({
    name: '  Maria Santos  ',
    contact: '  09171234567  ',
  });

  assert.deepEqual(result.errors, {});
  assert.deepEqual(result.value, {
    name: 'Maria Santos',
    contact: '09171234567',
  });
});

test('manual reservation customer validation requires bounded name and contact', () => {
  const missing = validateManualReservationCustomer({ name: '', contact: '' });
  assert.equal(missing.value, null);
  assert.ok(missing.errors.name);
  assert.ok(missing.errors.contact);

  const oversized = validateManualReservationCustomer({
    name: 'x'.repeat(101),
    contact: 'x'.repeat(201),
  });
  assert.equal(oversized.value, null);
  assert.ok(oversized.errors.name);
  assert.ok(oversized.errors.contact);
});
