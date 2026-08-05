/**
 * Dos Hermanos Catering System — Shared Enums & Constants
 * Directly aligned with .ai/shared-data-types.json
 */

export const USER_ROLES = Object.freeze({
  ADMINISTRATOR: 'administrator',
  AUTHORIZED_STAFF: 'authorized_staff',
  CUSTOMER: 'customer'
});

export const RESERVATION_STATUS = Object.freeze({
  REQUESTED: 'requested',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled'
});

export const ORDER_STATUS = Object.freeze({
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
});

export const PAYMENT_STATUS = Object.freeze({
  UNPAID: 'unpaid',
  PARTIALLY_PAID: 'partially_paid',
  PAID: 'paid'
});

export const INVENTORY_ITEM_TYPES = Object.freeze({
  INGREDIENT: 'ingredient',
  SUPPLY: 'supply'
});

export const INVENTORY_MOVEMENT_TYPES = Object.freeze({
  ADDITION: 'addition',
  RESERVATION: 'reservation',
  DEDUCTION: 'deduction'
});

export const PAYMENT_TRANSACTION_TYPES = Object.freeze({
  DEPOSIT: 'deposit',
  PAYMENT: 'payment'
});
