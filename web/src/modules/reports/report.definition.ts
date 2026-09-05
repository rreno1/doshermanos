import type { EquipmentItem } from '@modules/resources/equipment.types';
import type { InventoryItem } from '@modules/resources/inventory.types';
import type { ReportPayment, ReportReservation } from './report.service';

export type ReportKind = 'reservations' | 'sales' | 'payments' | 'inventory' | 'equipment';

export type ReportDefinition = {
  title: string;
  note: string;
  filename: string;
  headers: string[];
  rows: string[][];
};

export function buildReport(
  kind: ReportKind,
  reservations: ReportReservation[] | null | undefined,
  payments: ReportPayment[] | null | undefined,
  inventory: InventoryItem[] | null | undefined,
  equipment: EquipmentItem[] | null | undefined,
): ReportDefinition {
  if (kind === 'reservations') return buildReservationReport(reservations ?? []);
  if (kind === 'sales') return buildSalesReport(reservations ?? []);
  if (kind === 'payments') return buildPaymentReport(payments ?? []);
  if (kind === 'inventory') return buildInventoryReport(inventory ?? []);
  return buildEquipmentReport(equipment ?? []);
}

function buildReservationReport(reservations: ReportReservation[]): ReportDefinition {
  return {
    title: 'Reservations',
    note: 'Up to 250 most recent records.',
    filename: 'dos-hermanos-reservations.csv',
    headers: ['Reservation ID', 'Status', 'Event start', 'Event end', 'Location', 'Guests', 'Package', 'Submitted'],
    rows: reservations.map((reservation) => [
      reservation.id,
      formatStatus(reservation.status),
      formatDate(reservation.eventStartDate),
      formatDate(reservation.eventEndDate),
      reservation.location,
      String(reservation.guestCount),
      reservation.packageName,
      formatDateTime(reservation.createdAt),
    ]),
  };
}

function buildSalesReport(reservations: ReportReservation[]): ReportDefinition {
  const saleReservations = reservations.filter(
    (reservation) => reservation.status === 'confirmed' || reservation.status === 'completed',
  );

  return {
    title: 'Sales',
    note: 'Base-package snapshots only; not final customized revenue.',
    filename: 'dos-hermanos-sales.csv',
    headers: ['Reservation ID', 'Status', 'Package', 'Event date', 'Guests', 'Base package amount'],
    rows: saleReservations.map((reservation) => [
      reservation.id,
      formatStatus(reservation.status),
      reservation.packageName,
      formatDate(reservation.eventStartDate),
      String(reservation.guestCount),
      formatMoney(reservation.packageBasePriceInCentavos),
    ]),
  };
}

function buildPaymentReport(payments: ReportPayment[]): ReportDefinition {
  return {
    title: 'Payments',
    note: 'Up to 250 most recent records.',
    filename: 'dos-hermanos-payments.csv',
    headers: ['Payment ID', 'Reservation ID', 'Package', 'Event date', 'Amount', 'Method', 'Reference', 'Recorded by', 'Recorded at'],
    rows: payments.map((payment) => [
      payment.id,
      payment.reservationId,
      payment.packageName,
      formatDate(payment.eventStartDate),
      formatMoney(payment.amountInCentavos),
      payment.method,
      payment.reference,
      payment.recordedByName,
      formatDateTime(payment.createdAt),
    ]),
  };
}

function buildInventoryReport(inventory: InventoryItem[]): ReportDefinition {
  return {
    title: 'Inventory',
    note: 'Up to 100 registry items.',
    filename: 'dos-hermanos-inventory.csv',
    headers: ['Item', 'Unit', 'Quantity', 'Low-stock threshold', 'Status', 'Stock warning'],
    rows: inventory.map((item) => [
      item.name,
      item.unit,
      String(item.quantity),
      String(item.lowStockThreshold),
      item.isActive ? 'Active' : 'Inactive',
      item.isActive && item.quantity <= item.lowStockThreshold ? 'Low stock' : 'OK',
    ]),
  };
}

function buildEquipmentReport(equipment: EquipmentItem[]): ReportDefinition {
  return {
    title: 'Equipment',
    note: 'Up to 100 registry items.',
    filename: 'dos-hermanos-equipment.csv',
    headers: ['Equipment', 'Unit', 'Total', 'Available', 'In use', 'Damaged', 'Missing', 'Status'],
    rows: equipment.map((item) => [
      item.name,
      item.unit,
      String(item.totalQuantity),
      String(item.availableQuantity),
      String(item.inUseQuantity),
      String(item.damagedQuantity),
      String(item.missingQuantity),
      item.isActive ? 'Active' : 'Inactive',
    ]),
  };
}

function formatStatus(value: string) {
  return value
    .split('_')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' }).format(value);
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(value);
}

function formatMoney(valueInCentavos: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(valueInCentavos / 100);
}
