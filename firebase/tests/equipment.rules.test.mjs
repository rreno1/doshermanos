import { after, before, beforeEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const rulesPath = resolve(currentDirectory, '../firestore.rules');
const projectId = 'demo-dos-hermanos-equipment';
const fixedTime = Timestamp.fromMillis(1_700_000_000_000);
const eventStart = Timestamp.fromDate(new Date('2026-10-12T00:00:00.000Z'));
const eventEnd = Timestamp.fromDate(new Date('2026-10-12T00:00:00.000Z'));

let testEnvironment;

function userProfile(displayName, role, status = 'active') {
  return {
    displayName,
    role,
    status,
    createdAt: fixedTime,
    updatedAt: fixedTime,
  };
}

function reservation(overrides = {}) {
  return {
    customerId: 'customer-a',
    status: 'pending_review',
    event: {
      startDate: eventStart,
      endDate: eventEnd,
      location: 'Hilongos, Leyte',
      guestCount: 100,
      serviceRequirements: '',
    },
    package: {
      packageId: 'package-a',
      packageName: 'Classic Package',
      priceInCentavos: 2500000,
    },
    createdAt: fixedTime,
    updatedAt: fixedTime,
    ...overrides,
  };
}

function equipmentItem(overrides = {}) {
  return {
    name: 'Monoblock Chair',
    unit: 'pieces',
    totalQuantity: 10,
    availableQuantity: 10,
    inUseQuantity: 0,
    damagedQuantity: 0,
    missingQuantity: 0,
    isActive: true,
    lastTransactionId: null,
    createdAt: fixedTime,
    updatedAt: fixedTime,
    ...overrides,
  };
}

function assignment(overrides = {}) {
  return {
    reservationId: 'reservation-a',
    customerId: 'customer-a',
    packageName: 'Classic Package',
    eventStartDate: eventStart,
    eventEndDate: eventEnd,
    equipmentId: 'chairs',
    equipmentName: 'Monoblock Chair',
    unit: 'pieces',
    assignedQuantity: 5,
    status: 'assigned',
    releaseTransactionId: null,
    returnTransactionId: null,
    returnedGoodQuantity: 0,
    damagedQuantity: 0,
    missingQuantity: 0,
    note: '',
    returnNote: '',
    createdBy: 'staff-a',
    createdByName: 'Staff A',
    createdAt: fixedTime,
    updatedAt: fixedTime,
    ...overrides,
  };
}

async function seedBaseRecords() {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore();
    await setDoc(doc(database, 'users', 'customer-a'), userProfile('Customer A', 'customer'));
    await setDoc(doc(database, 'users', 'staff-a'), userProfile('Staff A', 'staff'));
    await setDoc(doc(database, 'users', 'admin-a'), userProfile('Admin A', 'admin'));
    await setDoc(
      doc(database, 'users', 'suspended-staff'),
      userProfile('Suspended Staff', 'staff', 'suspended'),
    );
    await setDoc(doc(database, 'reservations', 'reservation-a'), reservation());
    await setDoc(
      doc(database, 'reservations', 'cancelled-reservation'),
      reservation({ status: 'cancelled' }),
    );
    await setDoc(doc(database, 'equipment', 'chairs'), equipmentItem());
    await setDoc(
      doc(database, 'equipment', 'inactive-tables'),
      equipmentItem({ name: 'Banquet Table', unit: 'tables', isActive: false }),
    );
  });
}

before(async () => {
  const rules = await readFile(rulesPath, 'utf8');
  testEnvironment = await initializeTestEnvironment({
    projectId,
    firestore: { rules },
  });
});

beforeEach(async () => {
  await testEnvironment.clearFirestore();
  await seedBaseRecords();
});

after(async () => {
  await testEnvironment.cleanup();
});

test('equipment data is private to active staff and administrators', async () => {
  const publicDatabase = testEnvironment.unauthenticatedContext().firestore();
  const customerDatabase = testEnvironment.authenticatedContext('customer-a').firestore();
  const staffDatabase = testEnvironment.authenticatedContext('staff-a').firestore();
  const suspendedDatabase = testEnvironment.authenticatedContext('suspended-staff').firestore();

  await assertFails(getDoc(doc(publicDatabase, 'equipment', 'chairs')));
  await assertFails(getDocs(collection(customerDatabase, 'equipment')));
  await assertFails(getDocs(collection(customerDatabase, 'equipmentAssignments')));
  await assertFails(getDocs(collection(customerDatabase, 'equipmentTransactions')));
  await assertFails(getDocs(collection(suspendedDatabase, 'equipment')));
  await assertSucceeds(getDocs(collection(staffDatabase, 'equipment')));
});

test('staff can register consistent equipment counts only', async () => {
  const database = testEnvironment.authenticatedContext('staff-a').firestore();

  await assertSucceeds(
    setDoc(doc(database, 'equipment', 'linens'), {
      name: 'Table Linen',
      unit: 'pieces',
      totalQuantity: 20,
      availableQuantity: 20,
      inUseQuantity: 0,
      damagedQuantity: 0,
      missingQuantity: 0,
      isActive: true,
      lastTransactionId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );

  await assertFails(
    setDoc(doc(database, 'equipment', 'forged-counts'), {
      name: 'Tent',
      unit: 'pieces',
      totalQuantity: 10,
      availableQuantity: 11,
      inUseQuantity: 0,
      damagedQuantity: 0,
      missingQuantity: 0,
      isActive: true,
      lastTransactionId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
});

test('staff can assign active equipment to an eligible reservation', async () => {
  const database = testEnvironment.authenticatedContext('staff-a').firestore();

  await assertSucceeds(
    setDoc(doc(database, 'equipmentAssignments', 'assignment-a'), {
      reservationId: 'reservation-a',
      customerId: 'customer-a',
      packageName: 'Classic Package',
      eventStartDate: eventStart,
      eventEndDate: eventEnd,
      equipmentId: 'chairs',
      equipmentName: 'Monoblock Chair',
      unit: 'pieces',
      assignedQuantity: 5,
      status: 'assigned',
      releaseTransactionId: null,
      returnTransactionId: null,
      returnedGoodQuantity: 0,
      damagedQuantity: 0,
      missingQuantity: 0,
      note: 'For guest seating',
      returnNote: '',
      createdBy: 'staff-a',
      createdByName: 'Staff A',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
});

test('assignment rejects forged reservation or equipment data', async () => {
  const database = testEnvironment.authenticatedContext('staff-a').firestore();
  const baseAssignment = {
    reservationId: 'reservation-a',
    customerId: 'customer-a',
    packageName: 'Classic Package',
    eventStartDate: eventStart,
    eventEndDate: eventEnd,
    equipmentId: 'chairs',
    equipmentName: 'Monoblock Chair',
    unit: 'pieces',
    assignedQuantity: 5,
    status: 'assigned',
    releaseTransactionId: null,
    returnTransactionId: null,
    returnedGoodQuantity: 0,
    damagedQuantity: 0,
    missingQuantity: 0,
    note: '',
    returnNote: '',
    createdBy: 'staff-a',
    createdByName: 'Staff A',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await assertFails(
    setDoc(doc(database, 'equipmentAssignments', 'forged-package'), {
      ...baseAssignment,
      packageName: 'Fake Package',
    }),
  );
  await assertFails(
    setDoc(doc(database, 'equipmentAssignments', 'inactive-equipment'), {
      ...baseAssignment,
      equipmentId: 'inactive-tables',
      equipmentName: 'Banquet Table',
      unit: 'tables',
    }),
  );
  await assertFails(
    setDoc(doc(database, 'equipmentAssignments', 'cancelled-reservation'), {
      ...baseAssignment,
      reservationId: 'cancelled-reservation',
    }),
  );
  await assertFails(
    setDoc(doc(database, 'equipmentAssignments', 'too-many'), {
      ...baseAssignment,
      assignedQuantity: 11,
    }),
  );
});

test('equipment quantities cannot change without linked accountability writes', async () => {
  const database = testEnvironment.authenticatedContext('staff-a').firestore();

  await assertFails(
    updateDoc(doc(database, 'equipment', 'chairs'), {
      availableQuantity: 5,
      inUseQuantity: 5,
      updatedAt: serverTimestamp(),
    }),
  );
});

test('release atomically moves available equipment into use and creates history', async () => {
  await seedAssignment('assignment-a', assignment());
  const database = testEnvironment.authenticatedContext('staff-a').firestore();
  const batch = writeBatch(database);

  batch.update(doc(database, 'equipment', 'chairs'), {
    availableQuantity: 5,
    inUseQuantity: 5,
    lastTransactionId: 'release-a',
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(database, 'equipmentAssignments', 'assignment-a'), {
    status: 'released',
    releaseTransactionId: 'release-a',
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(database, 'equipmentTransactions', 'release-a'), {
    equipmentId: 'chairs',
    equipmentName: 'Monoblock Chair',
    unit: 'pieces',
    assignmentId: 'assignment-a',
    reservationId: 'reservation-a',
    type: 'release',
    quantity: 5,
    returnedGoodQuantity: 0,
    damagedQuantity: 0,
    missingQuantity: 0,
    note: '',
    recordedBy: 'staff-a',
    recordedByName: 'Staff A',
    createdAt: serverTimestamp(),
  });

  await assertSucceeds(batch.commit());
});

test('release fails after the linked reservation is rejected', async () => {
  await seedAssignment('assignment-a', assignment());
  const database = testEnvironment.authenticatedContext('staff-a').firestore();

  const rejectionBatch = writeBatch(database);
  rejectionBatch.update(doc(database, 'reservations', 'reservation-a'), {
    status: 'rejected',
    updatedAt: serverTimestamp(),
  });
  rejectionBatch.set(doc(database, 'reservationDecisions', 'reservation-a-rejected'), {
    reservationId: 'reservation-a',
    customerId: 'customer-a',
    previousStatus: 'pending_review',
    newStatus: 'rejected',
    decidedBy: 'staff-a',
    decidedByName: 'Staff A',
    createdAt: serverTimestamp(),
  });
  await assertSucceeds(rejectionBatch.commit());

  const batch = writeBatch(database);
  batch.update(doc(database, 'equipment', 'chairs'), {
    availableQuantity: 5,
    inUseQuantity: 5,
    lastTransactionId: 'release-rejected',
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(database, 'equipmentAssignments', 'assignment-a'), {
    status: 'released',
    releaseTransactionId: 'release-rejected',
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(database, 'equipmentTransactions', 'release-rejected'), {
    equipmentId: 'chairs',
    equipmentName: 'Monoblock Chair',
    unit: 'pieces',
    assignmentId: 'assignment-a',
    reservationId: 'reservation-a',
    type: 'release',
    quantity: 5,
    returnedGoodQuantity: 0,
    damagedQuantity: 0,
    missingQuantity: 0,
    note: '',
    recordedBy: 'staff-a',
    recordedByName: 'Staff A',
    createdAt: serverTimestamp(),
  });

  await assertFails(batch.commit());
});

test('release fails when physical availability is insufficient', async () => {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore();
    await setDoc(
      doc(database, 'equipment', 'chairs'),
      equipmentItem({ availableQuantity: 4, inUseQuantity: 6 }),
    );
    await setDoc(doc(database, 'equipmentAssignments', 'assignment-a'), assignment());
  });

  const database = testEnvironment.authenticatedContext('staff-a').firestore();
  const batch = writeBatch(database);
  batch.update(doc(database, 'equipment', 'chairs'), {
    availableQuantity: -1,
    inUseQuantity: 11,
    lastTransactionId: 'release-overbooked',
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(database, 'equipmentAssignments', 'assignment-a'), {
    status: 'released',
    releaseTransactionId: 'release-overbooked',
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(database, 'equipmentTransactions', 'release-overbooked'), {
    equipmentId: 'chairs',
    equipmentName: 'Monoblock Chair',
    unit: 'pieces',
    assignmentId: 'assignment-a',
    reservationId: 'reservation-a',
    type: 'release',
    quantity: 5,
    returnedGoodQuantity: 0,
    damagedQuantity: 0,
    missingQuantity: 0,
    note: '',
    recordedBy: 'staff-a',
    recordedByName: 'Staff A',
    createdAt: serverTimestamp(),
  });

  await assertFails(batch.commit());
});

test('return accounts for usable, damaged, and missing equipment atomically', async () => {
  await seedReleasedAssignment();
  const database = testEnvironment.authenticatedContext('staff-a').firestore();
  const batch = writeBatch(database);

  batch.update(doc(database, 'equipment', 'chairs'), {
    availableQuantity: 8,
    inUseQuantity: 0,
    damagedQuantity: 1,
    missingQuantity: 1,
    lastTransactionId: 'return-a',
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(database, 'equipmentAssignments', 'assignment-a'), {
    status: 'closed',
    returnTransactionId: 'return-a',
    returnedGoodQuantity: 3,
    damagedQuantity: 1,
    missingQuantity: 1,
    returnNote: 'One chair cracked and one was not returned.',
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(database, 'equipmentTransactions', 'return-a'), {
    equipmentId: 'chairs',
    equipmentName: 'Monoblock Chair',
    unit: 'pieces',
    assignmentId: 'assignment-a',
    reservationId: 'reservation-a',
    type: 'return',
    quantity: 5,
    returnedGoodQuantity: 3,
    damagedQuantity: 1,
    missingQuantity: 1,
    note: 'One chair cracked and one was not returned.',
    recordedBy: 'staff-a',
    recordedByName: 'Staff A',
    createdAt: serverTimestamp(),
  });

  await assertSucceeds(batch.commit());
});

test('return rejects unaccounted quantities and unexplained damage', async () => {
  await seedReleasedAssignment();
  const database = testEnvironment.authenticatedContext('staff-a').firestore();

  const mismatchBatch = writeBatch(database);
  mismatchBatch.update(doc(database, 'equipment', 'chairs'), {
    availableQuantity: 8,
    inUseQuantity: 0,
    damagedQuantity: 1,
    missingQuantity: 0,
    lastTransactionId: 'return-mismatch',
    updatedAt: serverTimestamp(),
  });
  mismatchBatch.update(doc(database, 'equipmentAssignments', 'assignment-a'), {
    status: 'closed',
    returnTransactionId: 'return-mismatch',
    returnedGoodQuantity: 3,
    damagedQuantity: 1,
    missingQuantity: 0,
    returnNote: 'Damaged chair',
    updatedAt: serverTimestamp(),
  });
  mismatchBatch.set(doc(database, 'equipmentTransactions', 'return-mismatch'), {
    equipmentId: 'chairs',
    equipmentName: 'Monoblock Chair',
    unit: 'pieces',
    assignmentId: 'assignment-a',
    reservationId: 'reservation-a',
    type: 'return',
    quantity: 5,
    returnedGoodQuantity: 3,
    damagedQuantity: 1,
    missingQuantity: 0,
    note: 'Damaged chair',
    recordedBy: 'staff-a',
    recordedByName: 'Staff A',
    createdAt: serverTimestamp(),
  });
  await assertFails(mismatchBatch.commit());

  const noNoteBatch = writeBatch(database);
  noNoteBatch.update(doc(database, 'equipment', 'chairs'), {
    availableQuantity: 9,
    inUseQuantity: 0,
    damagedQuantity: 1,
    missingQuantity: 0,
    lastTransactionId: 'return-no-note',
    updatedAt: serverTimestamp(),
  });
  noNoteBatch.update(doc(database, 'equipmentAssignments', 'assignment-a'), {
    status: 'closed',
    returnTransactionId: 'return-no-note',
    returnedGoodQuantity: 4,
    damagedQuantity: 1,
    missingQuantity: 0,
    returnNote: '',
    updatedAt: serverTimestamp(),
  });
  noNoteBatch.set(doc(database, 'equipmentTransactions', 'return-no-note'), {
    equipmentId: 'chairs',
    equipmentName: 'Monoblock Chair',
    unit: 'pieces',
    assignmentId: 'assignment-a',
    reservationId: 'reservation-a',
    type: 'return',
    quantity: 5,
    returnedGoodQuantity: 4,
    damagedQuantity: 1,
    missingQuantity: 0,
    note: '',
    recordedBy: 'staff-a',
    recordedByName: 'Staff A',
    createdAt: serverTimestamp(),
  });
  await assertFails(noNoteBatch.commit());
});

test('unreleased assignment may be cancelled but accountability history cannot be edited', async () => {
  await seedAssignment('assignment-a', assignment());
  const database = testEnvironment.authenticatedContext('staff-a').firestore();

  await assertSucceeds(
    updateDoc(doc(database, 'equipmentAssignments', 'assignment-a'), {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    }),
  );

  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const adminDatabase = context.firestore();
    await setDoc(doc(adminDatabase, 'equipmentTransactions', 'history-a'), {
      equipmentId: 'chairs',
      equipmentName: 'Monoblock Chair',
      unit: 'pieces',
      assignmentId: 'assignment-a',
      reservationId: 'reservation-a',
      type: 'release',
      quantity: 5,
      returnedGoodQuantity: 0,
      damagedQuantity: 0,
      missingQuantity: 0,
      note: '',
      recordedBy: 'staff-a',
      recordedByName: 'Staff A',
      createdAt: fixedTime,
    });
  });

  await assertFails(
    updateDoc(doc(database, 'equipmentTransactions', 'history-a'), {
      quantity: 4,
    }),
  );
});

async function seedAssignment(id, data) {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'equipmentAssignments', id), data);
  });
}

async function seedReleasedAssignment() {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore();
    await setDoc(
      doc(database, 'equipment', 'chairs'),
      equipmentItem({
        availableQuantity: 5,
        inUseQuantity: 5,
        lastTransactionId: 'release-a',
      }),
    );
    await setDoc(
      doc(database, 'equipmentAssignments', 'assignment-a'),
      assignment({ status: 'released', releaseTransactionId: 'release-a' }),
    );
  });
}
