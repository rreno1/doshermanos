/**
 * Dos Hermanos Catering System — Authoritative Calculation Formulas
 * Aligned with .ai/integration-rules.json section 5.
 */

import { PAYMENT_STATUS } from '../constants/enums.js';

/**
 * Calculates available stock quantity.
 * Formula: available_quantity = quantity_on_hand - quantity_reserved
 */
export function calculateAvailableQuantity(quantity_on_hand, quantity_reserved) {
  const hand = Math.max(0, Number(quantity_on_hand || 0));
  const reserved = Math.max(0, Number(quantity_reserved || 0));
  return Math.max(0, hand - reserved);
}

/**
 * Derives total paid from a list of valid payment transaction records.
 * Formula: total_paid = SUM(valid Payment Transactions)
 */
export function calculateTotalPaid(paymentTransactions = []) {
  return paymentTransactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
}

/**
 * Derives remaining balance for a catering order.
 * Formula: remaining_balance = total_amount - total_paid
 */
export function calculateRemainingBalance(total_amount, total_paid) {
  const total = Math.max(0, Number(total_amount || 0));
  const paid = Math.max(0, Number(total_paid || 0));
  return Math.max(0, total - paid);
}

/**
 * Derives payment status enum based on total amount and total paid.
 */
export function derivePaymentStatus(total_amount, total_paid) {
  const total = Number(total_amount || 0);
  const paid = Number(total_paid || 0);

  if (paid <= 0) {
    return PAYMENT_STATUS.UNPAID;
  }
  if (paid >= total && total > 0) {
    return PAYMENT_STATUS.PAID;
  }
  return PAYMENT_STATUS.PARTIALLY_PAID;
}

/**
 * Checks if a proposed date range overlaps an existing approved schedule.
 */
export function checkScheduleOverlap(proposedStart, proposedEnd, existingSchedules = []) {
  const pStart = new Date(proposedStart).getTime();
  const pEnd = new Date(proposedEnd).getTime();

  return existingSchedules.some(sched => {
    const sStart = new Date(sched.start_datetime).getTime();
    const sEnd = new Date(sched.end_datetime).getTime();
    return pStart < sEnd && pEnd > sStart;
  });
}
