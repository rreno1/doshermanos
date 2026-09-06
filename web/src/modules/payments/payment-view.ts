import type { PaymentRecord, PaymentReservation } from './payment.types';

export type PaymentsTab = 'reservations' | 'records';
export type SortDirection = 'asc' | 'desc';
export type PaymentSort = 'event' | 'package' | 'status' | 'date' | 'amount' | 'recorder';

export function getPaymentViewDefaults(tab: PaymentsTab): { sortBy: PaymentSort; direction: SortDirection } {
  if (tab === 'reservations') return { sortBy: 'event', direction: 'asc' };
  return { sortBy: 'date', direction: 'desc' };
}

export function filterReservations(
  reservations: PaymentReservation[],
  query: string,
  status: string,
  sortBy: PaymentSort,
  direction: SortDirection,
) {
  const text = query.trim().toLocaleLowerCase();
  return [...reservations]
    .filter((reservation) => status === 'all' || reservation.status === status)
    .filter((reservation) => !text || `${reservation.packageName} ${reservation.status} ${reservation.id}`.toLocaleLowerCase().includes(text))
    .sort((left, right) => compare(
      getReservationSortValue(left, sortBy),
      getReservationSortValue(right, sortBy),
      direction,
    ));
}

export function filterPayments(
  payments: PaymentRecord[],
  query: string,
  sortBy: PaymentSort,
  direction: SortDirection,
) {
  const text = query.trim().toLocaleLowerCase();
  return [...payments]
    .filter((payment) => !text || `${payment.packageName} ${payment.reference} ${payment.note} ${payment.recordedByName}`.toLocaleLowerCase().includes(text))
    .sort((left, right) => compare(
      getPaymentSortValue(left, sortBy),
      getPaymentSortValue(right, sortBy),
      direction,
    ));
}

export function getPaymentEmptyMessage(totalCount: number, visibleCount: number, tab: PaymentsTab) {
  if (totalCount === 0) {
    return tab === 'reservations'
      ? 'No reservations are ready for payment recording.'
      : 'No payments recorded yet.';
  }
  if (visibleCount === 0) {
    return tab === 'reservations'
      ? 'No reservations match the current view.'
      : 'No payment records match the current view.';
  }
  return undefined;
}

export function getReservationStatusPresentation(status: PaymentReservation['status']) {
  if (status === 'pending_review') {
    return { label: 'Pending review', className: 'management-status-badge management-status-badge-warn' };
  }
  if (status === 'confirmed') {
    return { label: 'Confirmed', className: 'management-status-badge management-status-badge-active' };
  }
  return { label: 'Completed', className: 'management-status-badge management-status-badge-active' };
}

function getReservationSortValue(reservation: PaymentReservation, sortBy: PaymentSort) {
  if (sortBy === 'package') return reservation.packageName;
  if (sortBy === 'status') return reservation.status;
  return reservation.eventStartDate.getTime();
}

function getPaymentSortValue(payment: PaymentRecord, sortBy: PaymentSort) {
  if (sortBy === 'amount') return payment.amountInCentavos;
  if (sortBy === 'package') return payment.packageName;
  if (sortBy === 'recorder') return payment.recordedByName;
  return payment.createdAt.getTime();
}

function compare(left: string | number, right: string | number, direction: SortDirection) {
  const result = typeof left === 'number' && typeof right === 'number'
    ? left - right
    : String(left).localeCompare(String(right), 'en-PH', { sensitivity: 'base' });
  return direction === 'asc' ? result : -result;
}
