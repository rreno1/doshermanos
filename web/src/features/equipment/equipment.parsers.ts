import { Timestamp, type DocumentSnapshot } from 'firebase/firestore';
import type {
  AssignableReservation,
  EquipmentAssignment,
  EquipmentItem,
} from './equipment.types';

export function parseEquipmentItem(snapshot: DocumentSnapshot): EquipmentItem {
  const data = snapshot.data();
  if (!data) {
    throw new Error('Equipment data is unavailable.');
  }

  return {
    id: snapshot.id,
    name: requireString(data.name, 'Equipment name is invalid.'),
    unit: requireString(data.unit, 'Equipment unit is invalid.'),
    totalQuantity: requireInteger(data.totalQuantity, 'Equipment quantity is invalid.'),
    availableQuantity: requireInteger(data.availableQuantity, 'Equipment availability is invalid.'),
    inUseQuantity: requireInteger(data.inUseQuantity, 'Equipment usage count is invalid.'),
    damagedQuantity: requireInteger(data.damagedQuantity, 'Equipment damage count is invalid.'),
    missingQuantity: requireInteger(data.missingQuantity, 'Equipment missing count is invalid.'),
    isActive: data.isActive === true,
    lastTransactionId:
      data.lastTransactionId === null
        ? null
        : requireString(data.lastTransactionId, 'Equipment history link is invalid.'),
  };
}

export function parseEquipmentAssignment(snapshot: DocumentSnapshot): EquipmentAssignment {
  const data = snapshot.data();
  if (!data) {
    throw new Error('Equipment assignment data is unavailable.');
  }

  return {
    id: snapshot.id,
    reservationId: requireString(data.reservationId, 'Reservation reference is invalid.'),
    customerId: requireString(data.customerId, 'Customer reference is invalid.'),
    packageName: requireString(data.packageName, 'Package name is invalid.'),
    eventStartDate: requireTimestamp(data.eventStartDate, 'Event date is invalid.').toDate(),
    eventEndDate: requireTimestamp(data.eventEndDate, 'Event date is invalid.').toDate(),
    equipmentId: requireString(data.equipmentId, 'Equipment reference is invalid.'),
    equipmentName: requireString(data.equipmentName, 'Equipment name is invalid.'),
    unit: requireString(data.unit, 'Equipment unit is invalid.'),
    assignedQuantity: requireInteger(data.assignedQuantity, 'Assigned quantity is invalid.'),
    status: requireAssignmentStatus(data.status),
    releaseTransactionId: readNullableString(data.releaseTransactionId),
    returnTransactionId: readNullableString(data.returnTransactionId),
    returnedGoodQuantity: requireInteger(data.returnedGoodQuantity, 'Return quantity is invalid.'),
    damagedQuantity: requireInteger(data.damagedQuantity, 'Damage quantity is invalid.'),
    missingQuantity: requireInteger(data.missingQuantity, 'Missing quantity is invalid.'),
    note: requireString(data.note, 'Assignment note is invalid.', true),
    returnNote: requireString(data.returnNote, 'Return note is invalid.', true),
    createdAt: requireTimestamp(data.createdAt, 'Assignment date is invalid.').toDate(),
    updatedAt: requireTimestamp(data.updatedAt, 'Assignment date is invalid.').toDate(),
  };
}

export function parseAssignableReservation(snapshot: DocumentSnapshot): AssignableReservation {
  const data = snapshot.data();
  if (!data) {
    throw new Error('Reservation data is unavailable.');
  }
  const event = requireMap(data.event, 'Reservation event data is invalid.');
  const packageSnapshot = requireMap(data.package, 'Reservation package data is invalid.');

  return {
    id: snapshot.id,
    customerId: requireString(data.customerId, 'Reservation customer data is invalid.'),
    packageName: requireString(packageSnapshot.packageName, 'Reservation package data is invalid.'),
    eventStartDate: requireTimestamp(event.startDate, 'Reservation date data is invalid.').toDate(),
    eventEndDate: requireTimestamp(event.endDate, 'Reservation date data is invalid.').toDate(),
  };
}

export function requireMap(value: unknown, message: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(message);
  }
  return value as Record<string, unknown>;
}

export function requireString(value: unknown, message: string, allowEmpty = false): string {
  if (typeof value !== 'string' || (!allowEmpty && value.length === 0)) {
    throw new Error(message);
  }
  return value;
}

export function requireInteger(value: unknown, message: string): number {
  if (!Number.isInteger(value)) {
    throw new Error(message);
  }
  return value as number;
}

export function requireTimestamp(value: unknown, message: string): Timestamp {
  if (!(value instanceof Timestamp)) {
    throw new Error(message);
  }
  return value;
}

function readNullableString(value: unknown): string | null {
  return value === null ? null : requireString(value, 'Equipment history link is invalid.');
}

function requireAssignmentStatus(value: unknown): EquipmentAssignment['status'] {
  if (value === 'assigned' || value === 'released' || value === 'closed' || value === 'cancelled') {
    return value;
  }
  throw new Error('Equipment assignment status is invalid.');
}
