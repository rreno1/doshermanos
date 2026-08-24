import assert from 'node:assert/strict';
import test from 'node:test';
import { validateReservationForm } from '../src/features/reservations/reservation.validation.ts';

function validForm(overrides = {}) {
  return {
    startDate: '2099-06-10',
    endDate: '2099-06-10',
    location: '  Hilongos, Leyte  ',
    guestCount: '120',
    serviceRequirements: '  Extra serving table  ',
    ...overrides,
  };
}

test('reservation validation accepts a valid request and normalizes text fields', () => {
  const result = validateReservationForm(validForm());

  assert.deepEqual(result.errors, {});
  assert.deepEqual(result.value, {
    startDate: '2099-06-10',
    endDate: '2099-06-10',
    location: 'Hilongos, Leyte',
    guestCount: 120,
    serviceRequirements: 'Extra serving table',
  });
});

test('reservation validation rejects impossible and past dates', () => {
  const impossible = validateReservationForm(validForm({ startDate: '2099-02-30' }));
  const past = validateReservationForm(validForm({ startDate: '2000-01-01' }));

  assert.equal(impossible.value, null);
  assert.equal(impossible.errors.startDate, 'Choose a valid event start date.');
  assert.equal(past.value, null);
  assert.equal(past.errors.startDate, 'The event start date cannot be in the past.');
});

test('reservation validation rejects an end date before the start date', () => {
  const result = validateReservationForm(
    validForm({ startDate: '2099-06-11', endDate: '2099-06-10' }),
  );

  assert.equal(result.value, null);
  assert.equal(result.errors.endDate, 'The end date cannot be before the start date.');
});

test('reservation validation rejects invalid guest counts and oversized text', () => {
  const invalidGuests = validateReservationForm(validForm({ guestCount: '1.5' }));
  const oversizedLocation = validateReservationForm(validForm({ location: 'x'.repeat(301) }));
  const oversizedRequirements = validateReservationForm(
    validForm({ serviceRequirements: 'x'.repeat(1001) }),
  );

  assert.equal(invalidGuests.value, null);
  assert.equal(invalidGuests.errors.guestCount, 'Enter a guest count from 1 to 10,000.');
  assert.equal(oversizedLocation.value, null);
  assert.equal(
    oversizedLocation.errors.location,
    'Keep the event location within 300 characters.',
  );
  assert.equal(oversizedRequirements.value, null);
  assert.equal(
    oversizedRequirements.errors.serviceRequirements,
    'Keep service requirements within 1,000 characters.',
  );
});
