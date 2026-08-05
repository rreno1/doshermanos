/**
 * Dos Hermanos Catering System — Shared Validation Rules
 * Aligned with .ai/security-rules.json and .ai/contracts/shared-interfaces.json
 */

import { USER_ROLES, RESERVATION_STATUS, PAYMENT_TRANSACTION_TYPES } from '../constants/enums.js';

export function validateReservationInput({ customer_user_id, preferred_start_datetime, preferred_end_datetime, event_location, guest_count, package_id }) {
  const errors = [];

  if (!customer_user_id) errors.push({ field: 'customer_user_id', message: 'Customer account ID is required.' });
  if (!preferred_start_datetime) errors.push({ field: 'preferred_start_datetime', message: 'Event start date/time is required.' });
  if (!preferred_end_datetime) errors.push({ field: 'preferred_end_datetime', message: 'Event end date/time is required.' });

  if (preferred_start_datetime && preferred_end_datetime) {
    const start = new Date(preferred_start_datetime);
    const end = new Date(preferred_end_datetime);
    if (end <= start) {
      errors.push({ field: 'preferred_end_datetime', message: 'Event end time must be later than start time.' });
    }
  }

  if (!event_location || event_location.trim() === '') {
    errors.push({ field: 'event_location', message: 'Event location is required.' });
  }

  if (!guest_count || Number(guest_count) <= 0 || !Number.isInteger(Number(guest_count))) {
    errors.push({ field: 'guest_count', message: 'Guest count must be a positive whole number.' });
  }

  if (!package_id) errors.push({ field: 'package_id', message: 'Please select a catering package.' });

  return { isValid: errors.length === 0, errors };
}

export function validatePaymentInput({ amount, total_amount, current_total_paid }) {
  const errors = [];
  const numericAmount = Number(amount);
  const numericTotal = Number(total_amount);
  const numericPaid = Number(current_total_paid || 0);

  if (isNaN(numericAmount) || numericAmount <= 0) {
    errors.push({ field: 'amount', message: 'Payment amount must be greater than zero.' });
  }

  if (numericPaid + numericAmount > numericTotal + 0.01) {
    errors.push({ field: 'amount', message: `Payment amount exceeds remaining balance. Remaining: ₱${(numericTotal - numericPaid).toFixed(2)}` });
  }

  return { isValid: errors.length === 0, errors };
}

export function validateEquipmentVerification({ released_quantity, returned_quantity, missing_quantity, damaged_quantity }) {
  const errors = [];
  const released = Number(released_quantity || 0);
  const returned = Number(returned_quantity || 0);
  const missing = Number(missing_quantity || 0);
  const damaged = Number(damaged_quantity || 0);

  if (returned < 0 || missing < 0 || damaged < 0) {
    errors.push({ message: 'Equipment quantities cannot be negative.' });
  }

  if (released !== returned + missing + damaged) {
    errors.push({ message: `Quantity discrepancy: Released (${released}) does not equal Returned (${returned}) + Missing (${missing}) + Damaged (${damaged}).` });
  }

  return { isValid: errors.length === 0, errors };
}
