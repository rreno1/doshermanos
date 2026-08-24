import assert from 'node:assert/strict';
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
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const rulesPath = resolve(currentDirectory, '../firestore.rules');
const projectId = 'demo-dos-hermanos-reservations';

let testEnvironment;

function businessDate(year, month, day) {
  return Timestamp.fromDate(new Date(Date.UTC(year, month - 1, day)));
}

function userProfile(displayName, role, status = 'active') {
  const timestamp = Timestamp.fromMillis(1_700_000_000_000);

  return {
    displayName,
    role,
    status,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function packageRecord(name, isActive, priceInCentavos = 250000) {
  const timestamp = Timestamp.fromMillis(1_700_000_000_000);

  return {
    name,
    description: `${name} description`,
    priceInCentavos,
    menuHighlights: ['Main dish', 'Dessert'],
    isActive,
    sortOrder: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function reservationRequest(customerId, options = {}) {
  return {
    customerId,
    status: options.status ?? 'pending_review',
    event: {
      startDate: options.startDate ?? businessDate(2026, 9, 12),
      endDate: options.endDate ?? businessDate(2026, 9, 12),
      location: options.location ?? 'Hilongos, Leyte',
      guestCount: options.guestCount ?? 120,
      serviceRequirements: options.serviceRequirements ?? '',
    },
    package: {
      packageId: options.packageId ?? 'active-package',
      packageName: options.packageName ?? 'Active Package',
      priceInCentavos: options.priceInCentavos ?? 250000,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

function rejectionDecision(reservationId, customerId, options = {}) {
  return {
    reservationId,
    customerId,
    previousStatus: 'pending_review',
    newStatus: 'rejected',
    decidedBy: options.decidedBy ?? 'staff-a',
    decidedByName: options.decidedByName ?? 'Staff A',
    createdAt: serverTimestamp(),
  };
}

async function seedBaseRecords() {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore();

    await setDoc(doc(database, 'users', 'customer-a'), userProfile('Customer A', 'customer'));
    await setDoc(doc(database, 'users', 'customer-b'), userProfile('Customer B', 'customer'));
    await setDoc(doc(database, 'users', 'staff-a'), userProfile('Staff A', 'staff'));
    await setDoc(doc(database, 'users', 'admin-a'), userProfile('Admin A', 'admin'));
    await setDoc(
      doc(database, 'packages', 'active-package'),
      packageRecord('Active Package', true),
    );
    await setDoc(
      doc(database, 'packages', 'inactive-package'),
      packageRecord('Inactive Package', false),
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

test('unauthenticated users cannot create reservation requests', async () => {
  const database = testEnvironment.unauthenticatedContext().firestore();
  await assertFails(
    setDoc(
      doc(database, 'reservations', 'public-request'),
      reservationRequest('customer-a'),
    ),
  );
});

test('customer can create their own pending reservation request', async () => {
  const database = testEnvironment.authenticatedContext('customer-a').firestore();
  await assertSucceeds(
    setDoc(
      doc(database, 'reservations', 'customer-a-request'),
      reservationRequest('customer-a'),
    ),
  );
});

test('two customers can request events on the same date', async () => {
  const customerADatabase = testEnvironment.authenticatedContext('customer-a').firestore();
  const customerBDatabase = testEnvironment.authenticatedContext('customer-b').firestore();
  const eventDate = businessDate(2026, 10, 3);

  await assertSucceeds(
    setDoc(
      doc(customerADatabase, 'reservations', 'same-date-a'),
      reservationRequest('customer-a', { startDate: eventDate, endDate: eventDate }),
    ),
  );
  await assertSucceeds(
    setDoc(
      doc(customerBDatabase, 'reservations', 'same-date-b'),
      reservationRequest('customer-b', { startDate: eventDate, endDate: eventDate }),
    ),
  );
});

test('reservation dates must be timestamps in chronological order', async () => {
  const database = testEnvironment.authenticatedContext('customer-a').firestore();

  await assertFails(
    setDoc(
      doc(database, 'reservations', 'string-dates'),
      reservationRequest('customer-a', {
        startDate: '2026-10-03',
        endDate: '2026-10-03',
      }),
    ),
  );

  await assertFails(
    setDoc(
      doc(database, 'reservations', 'reversed-dates'),
      reservationRequest('customer-a', {
        startDate: businessDate(2026, 10, 4),
        endDate: businessDate(2026, 10, 3),
      }),
    ),
  );
});

test('customer cannot create a reservation for another customer', async () => {
  const database = testEnvironment.authenticatedContext('customer-a').firestore();
  await assertFails(
    setDoc(
      doc(database, 'reservations', 'forged-owner'),
      reservationRequest('customer-b'),
    ),
  );
});

test('customer cannot submit a request as already confirmed', async () => {
  const database = testEnvironment.authenticatedContext('customer-a').firestore();
  await assertFails(
    setDoc(
      doc(database, 'reservations', 'forged-confirmation'),
      reservationRequest('customer-a', { status: 'confirmed' }),
    ),
  );
});

test('customer cannot forge the package snapshot price or name', async () => {
  const database = testEnvironment.authenticatedContext('customer-a').firestore();
  await assertFails(
    setDoc(
      doc(database, 'reservations', 'forged-price'),
      reservationRequest('customer-a', { priceInCentavos: 1 }),
    ),
  );
  await assertFails(
    setDoc(
      doc(database, 'reservations', 'forged-name'),
      reservationRequest('customer-a', { packageName: 'Different Package' }),
    ),
  );
});

test('customer cannot create a request using an inactive package', async () => {
  const database = testEnvironment.authenticatedContext('customer-a').firestore();
  await assertFails(
    setDoc(
      doc(database, 'reservations', 'inactive-package-request'),
      reservationRequest('customer-a', {
        packageId: 'inactive-package',
        packageName: 'Inactive Package',
      }),
    ),
  );
});

test('reservation service requirements are bounded', async () => {
  const database = testEnvironment.authenticatedContext('customer-a').firestore();
  await assertFails(
    setDoc(
      doc(database, 'reservations', 'oversized-requirements'),
      reservationRequest('customer-a', { serviceRequirements: 'x'.repeat(1001) }),
    ),
  );
});

test('customer can read only their own reservation records with the production query shape', async () => {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore();
    const timestamp = Timestamp.fromMillis(1_700_000_000_000);

    await setDoc(doc(database, 'reservations', 'request-a'), {
      ...reservationRequest('customer-a'),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await setDoc(doc(database, 'reservations', 'request-b'), {
      ...reservationRequest('customer-b'),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });

  const database = testEnvironment.authenticatedContext('customer-a').firestore();
  await assertSucceeds(getDoc(doc(database, 'reservations', 'request-a')));
  await assertFails(getDoc(doc(database, 'reservations', 'request-b')));

  const ownReservationsQuery = query(
    collection(database, 'reservations'),
    where('customerId', '==', 'customer-a'),
    orderBy('createdAt', 'desc'),
    limit(20),
  );
  const snapshot = await assertSucceeds(getDocs(ownReservationsQuery));

  assert.equal(snapshot.size, 1);
  assert.equal(snapshot.docs[0]?.id, 'request-a');
});

test('staff cannot confirm or directly reject a pending request without a decision record', async () => {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore();
    const timestamp = Timestamp.fromMillis(1_700_000_000_000);
    await setDoc(doc(database, 'reservations', 'pending-request'), {
      ...reservationRequest('customer-a'),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });

  const database = testEnvironment.authenticatedContext('staff-a').firestore();
  const reservationRef = doc(database, 'reservations', 'pending-request');

  await assertFails(
    updateDoc(reservationRef, {
      status: 'confirmed',
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(reservationRef, {
      status: 'rejected',
      updatedAt: serverTimestamp(),
    }),
  );
});

test('staff can atomically reject a pending request with an immutable decision record', async () => {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore();
    const timestamp = Timestamp.fromMillis(1_700_000_000_000);
    await setDoc(doc(database, 'reservations', 'reviewed-request'), {
      ...reservationRequest('customer-a'),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });

  const database = testEnvironment.authenticatedContext('staff-a').firestore();
  const batch = writeBatch(database);
  const reservationRef = doc(database, 'reservations', 'reviewed-request');
  const decisionRef = doc(database, 'reservationDecisions', 'reviewed-request-rejected');

  batch.update(reservationRef, {
    status: 'rejected',
    updatedAt: serverTimestamp(),
  });
  batch.set(decisionRef, rejectionDecision('reviewed-request', 'customer-a'));
  await assertSucceeds(batch.commit());

  const reservationSnapshot = await assertSucceeds(getDoc(reservationRef));
  const decisionSnapshot = await assertSucceeds(getDoc(decisionRef));
  assert.equal(reservationSnapshot.data()?.status, 'rejected');
  assert.equal(decisionSnapshot.data()?.newStatus, 'rejected');

  await assertFails(
    updateDoc(decisionRef, {
      decidedByName: 'Changed Name',
    }),
  );
});

test('reservation rejection decision must match the authoritative customer and actor', async () => {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore();
    const timestamp = Timestamp.fromMillis(1_700_000_000_000);
    await setDoc(doc(database, 'reservations', 'forged-decision-request'), {
      ...reservationRequest('customer-a'),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });

  const database = testEnvironment.authenticatedContext('staff-a').firestore();
  const batch = writeBatch(database);
  batch.update(doc(database, 'reservations', 'forged-decision-request'), {
    status: 'rejected',
    updatedAt: serverTimestamp(),
  });
  batch.set(
    doc(database, 'reservationDecisions', 'forged-decision-request-rejected'),
    rejectionDecision('forged-decision-request', 'customer-b'),
  );
  await assertFails(batch.commit());
});

test('customers cannot read staff reservation decision records', async () => {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore();
    const timestamp = Timestamp.fromMillis(1_700_000_000_000);
    await setDoc(doc(database, 'reservationDecisions', 'private-decision'), {
      reservationId: 'request-a',
      customerId: 'customer-a',
      previousStatus: 'pending_review',
      newStatus: 'rejected',
      decidedBy: 'staff-a',
      decidedByName: 'Staff A',
      createdAt: timestamp,
    });
  });

  const database = testEnvironment.authenticatedContext('customer-a').firestore();
  await assertFails(getDoc(doc(database, 'reservationDecisions', 'private-decision')));
});

test('customer cannot alter a submitted reservation directly', async () => {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore();
    const timestamp = Timestamp.fromMillis(1_700_000_000_000);
    await setDoc(doc(database, 'reservations', 'locked-request'), {
      ...reservationRequest('customer-a'),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });

  const database = testEnvironment.authenticatedContext('customer-a').firestore();
  await assertFails(
    updateDoc(doc(database, 'reservations', 'locked-request'), {
      'event.guestCount': 500,
      updatedAt: serverTimestamp(),
    }),
  );
});
