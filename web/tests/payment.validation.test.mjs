import assert from 'node:assert/strict';
import test from 'node:test';
import { validateCashPayment } from '../src/modules/payments/payment.validation.ts';

test('cash payment validation converts pesos to integer centavos and trims text', () => {
  const result = validateCashPayment(' 5000.50 ', ' OR-102 ', ' received at office ');

  assert.deepEqual(result, {
    value: {
      amountInCentavos: 500050,
      reference: 'OR-102',
      note: 'received at office',
    },
    message: null,
  });
});

test('cash payment validation rejects zero and malformed decimal amounts', () => {
  const zero = validateCashPayment('0', '', '');
  const tooManyDecimals = validateCashPayment('12.345', '', '');

  assert.equal(zero.value, null);
  assert.equal(zero.message, 'Enter a payment amount greater than zero.');
  assert.equal(tooManyDecimals.value, null);
  assert.equal(tooManyDecimals.message, 'Enter a payment amount greater than zero.');
});

test('cash payment validation enforces the maximum amount', () => {
  const result = validateCashPayment('1000000.01', '', '');

  assert.equal(result.value, null);
  assert.equal(result.message, 'Payment amount is too large.');
});

test('cash payment validation bounds reference and internal note lengths', () => {
  const longReference = validateCashPayment('100', 'r'.repeat(121), '');
  const longNote = validateCashPayment('100', '', 'n'.repeat(301));

  assert.equal(longReference.value, null);
  assert.equal(longReference.message, 'Reference must be 120 characters or fewer.');
  assert.equal(longNote.value, null);
  assert.equal(longNote.message, 'Internal note must be 300 characters or fewer.');
});
