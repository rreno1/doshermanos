import assert from 'node:assert/strict';
import test from 'node:test';
import { validateReservationForm } from '../src/features/reservations/reservation.validation.ts';

function validForm(overrides = {}) {
  return {
    startDate: '2099-07-15',
    endDate: '2099-07-16',
    location: '  Brgy. Central, Hilongos  ',
    guestCount: '85',
    serviceRequirements: '  Outdoor setup  ',
    ...overrides,
  };
}

test('mobile reservation validation accepts and normalizes a valid request', () => {
  const result = validateReservationForm(validForm());

  assert.equal(result.message, null);
  assert.deepEqual(result.value, {
    startDate: '2099-07-15',
    endDate: '2099-07-16',
    location: 'Brgy. Central, Hilongos',
    guestCount: 85,
    serviceRequirements: 'Outdoor setup',
  });
});

test('mobile reservation validation rejects invalid, past, and reversed dates', () => {
  const impossible = validateReservationForm(validForm({ startDate: '2099-02-30' }));
  const past = validateReservationForm(validForm({ startDate: '2000-01-01' }));
  const reversed = validateReservationForm(
    validForm({ startDate: '2099-07-16', endDate: '2099-07-15' }),
  );

  assert.equal(impossible.value, null);
  assert.equal(impossible.message, 'Choose valid event dates.');
  assert.equal(past.value, null);
  assert.equal(past.message, 'The event start date cannot be in the past.');
  assert.equal(reversed.value, null);
  assert.equal(reversed.message, 'The end date cannot be before the start date.');
});

test('mobile reservation validation rejects invalid guest counts and oversized fields', () => {
  const invalidGuests = validateReservationForm(validForm({ guestCount: '0' }));
  const decimalGuests = validateReservationForm(validForm({ guestCount: '10.5' }));
  const oversizedLocation = validateReservationForm(validForm({ location: 'x'.repeat(301) }));
  const oversizedRequirements = validateReservationForm(
    validForm({ serviceRequirements: 'x'.repeat(1001) }),
  );

  assert.equal(invalidGuests.value, null);
  assert.equal(invalidGuests.message, 'Enter a guest count from 1 to 10,000.');
  assert.equal(decimalGuests.value, null);
  assert.equal(decimalGuests.message, 'Enter a guest count from 1 to 10,000.');
  assert.equal(oversizedLocation.value, null);
  assert.equal(oversizedLocation.message, 'Enter an event location within 300 characters.');
  assert.equal(oversizedRequirements.value, null);
  assert.equal(oversizedRequirements.message, 'Keep service requirements within 1,000 characters.');
});
