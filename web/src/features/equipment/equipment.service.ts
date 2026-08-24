import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { firestore } from '../../firebase/firebase';
import {
  parseAssignableReservation,
  parseEquipmentAssignment,
  parseEquipmentItem,
  parseEquipmentTransaction,
  requireInteger,
  requireMap,
  requireString,
  requireTimestamp,
} from './equipment.parsers';
import type {
  AssignableReservation,
  EquipmentAssignment,
  EquipmentAssignmentInput,
  EquipmentItem,
  EquipmentItemEditInput,
  EquipmentItemInput,
  EquipmentReturnInput,
  EquipmentTransactionRecord,
  StaffIdentity,
} from './equipment.types';

export function subscribeToEquipment(
  onItems: (items: EquipmentItem[]) => void,
  onError: () => void,
) {
  const equipmentQuery = query(
    collection(firestore, 'equipment'),
    orderBy('name', 'asc'),
    limit(100),
  );

  return onSnapshot(
    equipmentQuery,
    (snapshot) => {
      try {
        onItems(snapshot.docs.map(parseEquipmentItem));
      } catch {
        onError();
      }
    },
    onError,
  );
}

export function subscribeToEquipmentAssignments(
  onAssignments: (assignments: EquipmentAssignment[]) => void,
  onError: () => void,
) {
  const assignmentsQuery = query(
    collection(firestore, 'equipmentAssignments'),
    orderBy('updatedAt', 'desc'),
    limit(60),
  );

  return onSnapshot(
    assignmentsQuery,
    (snapshot) => {
      try {
        onAssignments(snapshot.docs.map(parseEquipmentAssignment));
      } catch {
        onError();
      }
    },
    onError,
  );
}

export function subscribeToEquipmentTransactions(
  onTransactions: (transactions: EquipmentTransactionRecord[]) => void,
  onError: () => void,
) {
  const transactionsQuery = query(
    collection(firestore, 'equipmentTransactions'),
    orderBy('createdAt', 'desc'),
    limit(30),
  );

  return onSnapshot(
    transactionsQuery,
    (snapshot) => {
      try {
        onTransactions(snapshot.docs.map(parseEquipmentTransaction));
      } catch {
        onError();
      }
    },
    onError,
  );
}

export async function loadAssignableReservations(): Promise<AssignableReservation[]> {
  const reservationsQuery = query(
    collection(firestore, 'reservations'),
    where('status', 'in', ['pending_review', 'confirmed']),
    orderBy('event.startDate', 'asc'),
    limit(100),
  );
  const snapshot = await getDocs(reservationsQuery);

  return snapshot.docs.map(parseAssignableReservation);
}

export async function createEquipmentItem(input: EquipmentItemInput) {
  const equipmentRef = doc(collection(firestore, 'equipment'));

  await setDoc(equipmentRef, {
    name: input.name.trim(),
    unit: input.unit.trim(),
    totalQuantity: input.totalQuantity,
    availableQuantity: input.totalQuantity,
    inUseQuantity: 0,
    damagedQuantity: 0,
    missingQuantity: 0,
    isActive: input.isActive,
    lastTransactionId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateEquipmentItem(
  equipmentId: string,
  input: EquipmentItemEditInput,
) {
  await updateDoc(doc(firestore, 'equipment', equipmentId), {
    name: input.name.trim(),
    isActive: input.isActive,
    updatedAt: serverTimestamp(),
  });
}

export async function createEquipmentAssignment(
  input: EquipmentAssignmentInput,
  staff: StaffIdentity,
) {
  const assignmentRef = doc(collection(firestore, 'equipmentAssignments'));
  const reservationRef = doc(firestore, 'reservations', input.reservationId);
  const equipmentRef = doc(firestore, 'equipment', input.equipmentId);

  await runTransaction(firestore, async (transaction) => {
    const reservationSnapshot = await transaction.get(reservationRef);
    const equipmentSnapshot = await transaction.get(equipmentRef);

    if (!reservationSnapshot.exists() || !equipmentSnapshot.exists()) {
      throw new Error('Reservation or equipment could not be found.');
    }

    const reservation = reservationSnapshot.data();
    const event = requireMap(reservation.event, 'Reservation event data is invalid.');
    const packageSnapshot = requireMap(reservation.package, 'Reservation package data is invalid.');
    const equipment = equipmentSnapshot.data();

    if (!['pending_review', 'confirmed'].includes(String(reservation.status))) {
      throw new Error('This reservation can no longer receive equipment assignments.');
    }

    if (equipment.isActive !== true) {
      throw new Error('Choose an active equipment item.');
    }

    const totalQuantity = requireInteger(equipment.totalQuantity, 'Equipment quantity is invalid.');
    if (input.assignedQuantity > totalQuantity) {
      throw new Error('Assigned quantity exceeds the registered equipment quantity.');
    }

    transaction.set(assignmentRef, {
      reservationId: reservationSnapshot.id,
      customerId: requireString(reservation.customerId, 'Reservation customer data is invalid.'),
      packageName: requireString(packageSnapshot.packageName, 'Reservation package data is invalid.'),
      eventStartDate: requireTimestamp(event.startDate, 'Reservation date data is invalid.'),
      eventEndDate: requireTimestamp(event.endDate, 'Reservation date data is invalid.'),
      equipmentId: equipmentSnapshot.id,
      equipmentName: requireString(equipment.name, 'Equipment name is invalid.'),
      unit: requireString(equipment.unit, 'Equipment unit is invalid.'),
      assignedQuantity: input.assignedQuantity,
      status: 'assigned',
      releaseTransactionId: null,
      returnTransactionId: null,
      returnedGoodQuantity: 0,
      damagedQuantity: 0,
      missingQuantity: 0,
      note: input.note.trim(),
      returnNote: '',
      createdBy: staff.id,
      createdByName: staff.displayName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}

export async function cancelEquipmentAssignment(assignmentId: string) {
  const assignmentRef = doc(firestore, 'equipmentAssignments', assignmentId);

  await runTransaction(firestore, async (transaction) => {
    const assignmentSnapshot = await transaction.get(assignmentRef);
    if (!assignmentSnapshot.exists() || assignmentSnapshot.data().status !== 'assigned') {
      throw new Error('Only an unreleased assignment can be cancelled.');
    }

    transaction.update(assignmentRef, {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });
  });
}

export async function releaseEquipmentAssignment(
  assignmentId: string,
  staff: StaffIdentity,
) {
  const assignmentRef = doc(firestore, 'equipmentAssignments', assignmentId);
  const transactionRef = doc(collection(firestore, 'equipmentTransactions'));

  await runTransaction(firestore, async (transaction) => {
    const assignmentSnapshot = await transaction.get(assignmentRef);
    if (!assignmentSnapshot.exists()) {
      throw new Error('Equipment assignment could not be found.');
    }

    const assignment = assignmentSnapshot.data();
    if (assignment.status !== 'assigned') {
      throw new Error('Only an assigned item can be released.');
    }

    const reservationRef = doc(
      firestore,
      'reservations',
      requireString(assignment.reservationId, 'Reservation reference is invalid.'),
    );
    const equipmentRef = doc(
      firestore,
      'equipment',
      requireString(assignment.equipmentId, 'Equipment reference is invalid.'),
    );
    const reservationSnapshot = await transaction.get(reservationRef);
    const equipmentSnapshot = await transaction.get(equipmentRef);

    if (!reservationSnapshot.exists()) {
      throw new Error('Linked reservation could not be found.');
    }

    if (!['pending_review', 'confirmed'].includes(String(reservationSnapshot.data().status))) {
      throw new Error('This reservation can no longer release equipment.');
    }

    if (!equipmentSnapshot.exists()) {
      throw new Error('Equipment item could not be found.');
    }

    const equipment = equipmentSnapshot.data();
    const quantity = requireInteger(assignment.assignedQuantity, 'Assigned quantity is invalid.');
    const available = requireInteger(equipment.availableQuantity, 'Equipment availability is invalid.');
    const inUse = requireInteger(equipment.inUseQuantity, 'Equipment usage count is invalid.');

    if (equipment.isActive !== true || available < quantity) {
      throw new Error('There is not enough available equipment to release this assignment.');
    }

    transaction.update(equipmentRef, {
      availableQuantity: available - quantity,
      inUseQuantity: inUse + quantity,
      lastTransactionId: transactionRef.id,
      updatedAt: serverTimestamp(),
    });
    transaction.update(assignmentRef, {
      status: 'released',
      releaseTransactionId: transactionRef.id,
      updatedAt: serverTimestamp(),
    });
    transaction.set(
      transactionRef,
      buildEquipmentTransaction(assignmentSnapshot, 'release', quantity, staff),
    );
  });
}

export async function returnEquipmentAssignment(
  assignmentId: string,
  input: EquipmentReturnInput,
  staff: StaffIdentity,
) {
  const assignmentRef = doc(firestore, 'equipmentAssignments', assignmentId);
  const transactionRef = doc(collection(firestore, 'equipmentTransactions'));

  await runTransaction(firestore, async (transaction) => {
    const assignmentSnapshot = await transaction.get(assignmentRef);
    if (!assignmentSnapshot.exists() || assignmentSnapshot.data().status !== 'released') {
      throw new Error('Only released equipment can be returned.');
    }

    const assignment = assignmentSnapshot.data();
    const equipmentRef = doc(
      firestore,
      'equipment',
      requireString(assignment.equipmentId, 'Equipment reference is invalid.'),
    );
    const equipmentSnapshot = await transaction.get(equipmentRef);
    if (!equipmentSnapshot.exists()) {
      throw new Error('Equipment item could not be found.');
    }

    const equipment = equipmentSnapshot.data();
    const quantity = requireInteger(assignment.assignedQuantity, 'Assigned quantity is invalid.');
    const inUse = requireInteger(equipment.inUseQuantity, 'Equipment usage count is invalid.');

    if (inUse < quantity) {
      throw new Error('Equipment usage data is inconsistent.');
    }

    transaction.update(equipmentRef, {
      availableQuantity:
        requireInteger(equipment.availableQuantity, 'Equipment availability is invalid.') +
        input.returnedGoodQuantity,
      inUseQuantity: inUse - quantity,
      damagedQuantity:
        requireInteger(equipment.damagedQuantity, 'Equipment damage count is invalid.') +
        input.damagedQuantity,
      missingQuantity:
        requireInteger(equipment.missingQuantity, 'Equipment missing count is invalid.') +
        input.missingQuantity,
      lastTransactionId: transactionRef.id,
      updatedAt: serverTimestamp(),
    });
    transaction.update(assignmentRef, {
      status: 'closed',
      returnTransactionId: transactionRef.id,
      returnedGoodQuantity: input.returnedGoodQuantity,
      damagedQuantity: input.damagedQuantity,
      missingQuantity: input.missingQuantity,
      returnNote: input.returnNote.trim(),
      updatedAt: serverTimestamp(),
    });
    transaction.set(transactionRef, {
      ...buildEquipmentTransaction(assignmentSnapshot, 'return', quantity, staff),
      returnedGoodQuantity: input.returnedGoodQuantity,
      damagedQuantity: input.damagedQuantity,
      missingQuantity: input.missingQuantity,
      note: input.returnNote.trim(),
    });
  });
}

function buildEquipmentTransaction(
  assignmentSnapshot: DocumentSnapshot,
  type: 'release' | 'return',
  quantity: number,
  staff: StaffIdentity,
) {
  const assignment = assignmentSnapshot.data();
  if (!assignment) {
    throw new Error('Equipment assignment data is unavailable.');
  }

  return {
    equipmentId: requireString(assignment.equipmentId, 'Equipment reference is invalid.'),
    equipmentName: requireString(assignment.equipmentName, 'Equipment name is invalid.'),
    unit: requireString(assignment.unit, 'Equipment unit is invalid.'),
    assignmentId: assignmentSnapshot.id,
    reservationId: requireString(assignment.reservationId, 'Reservation reference is invalid.'),
    type,
    quantity,
    returnedGoodQuantity: 0,
    damagedQuantity: 0,
    missingQuantity: 0,
    note: '',
    recordedBy: staff.id,
    recordedByName: staff.displayName,
    createdAt: serverTimestamp(),
  };
}
