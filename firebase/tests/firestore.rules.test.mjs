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
  deleteDoc,
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
const projectId = 'demo-dos-hermanos';

let testEnvironment;

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

function cateringPackage(name, isActive, sortOrder) {
  const timestamp = Timestamp.fromMillis(1_700_000_000_000);

  return {
    name,
    description: `${name} description`,
    priceInCentavos: 250000,
    menuHighlights: ['Main dish', 'Dessert'],
    isActive,
    sortOrder,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

async function seedBaseRecords() {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore();

    await setDoc(
      doc(database, 'users', 'customer-a'),
      userProfile('Customer A', 'customer'),
    );
    await setDoc(
      doc(database, 'users', 'customer-b'),
      userProfile('Customer B', 'customer'),
    );
    await setDoc(
      doc(database, 'users', 'staff-a'),
      userProfile('Staff A', 'staff'),
    );
    await setDoc(
      doc(database, 'users', 'admin-a'),
      userProfile('Admin A', 'admin'),
    );
    await setDoc(
      doc(database, 'users', 'suspended-admin'),
      userProfile('Suspended Admin', 'admin', 'suspended'),
    );

    await setDoc(
      doc(database, 'packages', 'active-package'),
      cateringPackage('Active Package', true, 1),
    );
    await setDoc(
      doc(database, 'packages', 'inactive-package'),
      cateringPackage('Inactive Package', false, 2),
    );
  });
}

async function recordAccessChange(eventId = 'access-event-1') {
  const database = testEnvironment.authenticatedContext('admin-a').firestore();
  const batch = writeBatch(database);

  batch.update(doc(database, 'users', 'customer-a'), {
    role: 'staff',
    status: 'active',
    lastAccessEventId: eventId,
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(database, 'userAccessEvents', eventId), {
    targetUserId: 'customer-a',
    targetDisplayName: 'Customer A',
    previousRole: 'customer',
    newRole: 'staff',
    previousStatus: 'active',
    newStatus: 'active',
    changedBy: 'admin-a',
    changedByName: 'Admin A',
    createdAt: serverTimestamp(),
  });

  await assertSucceeds(batch.commit());
  return { database, eventId };
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

test('public catalog can read only the active package query', async () => {
  const database = testEnvironment.unauthenticatedContext().firestore();
  const packagesQuery = query(
    collection(database, 'packages'),
    where('isActive', '==', true),
    orderBy('sortOrder', 'asc'),
    limit(24),
  );

  const snapshot = await assertSucceeds(getDocs(packagesQuery));

  assert.equal(snapshot.size, 1);
  assert.equal(snapshot.docs[0]?.id, 'active-package');
});

test('unauthenticated users cannot read an inactive package', async () => {
  const database = testEnvironment.unauthenticatedContext().firestore();

  await assertFails(getDoc(doc(database, 'packages', 'inactive-package')));
});

test('unauthenticated users cannot create package records', async () => {
  const database = testEnvironment.unauthenticatedContext().firestore();

  await assertFails(
    setDoc(doc(database, 'packages', 'forged-package'), {
      ...cateringPackage('Forged Package', true, 3),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
});

test('a customer can read their own profile but not another customer profile', async () => {
  const database = testEnvironment
    .authenticatedContext('customer-a')
    .firestore();

  await assertSucceeds(getDoc(doc(database, 'users', 'customer-a')));
  await assertFails(getDoc(doc(database, 'users', 'customer-b')));
});

test('a customer cannot promote their own role', async () => {
  const database = testEnvironment
    .authenticatedContext('customer-a')
    .firestore();

  await assertFails(
    updateDoc(doc(database, 'users', 'customer-a'), {
      role: 'admin',
      updatedAt: serverTimestamp(),
    }),
  );
});

test('a new signed-in user can create only an active customer profile for themselves', async () => {
  const database = testEnvironment
    .authenticatedContext('new-customer')
    .firestore();

  await assertSucceeds(
    setDoc(doc(database, 'users', 'new-customer'), {
      displayName: 'New Customer',
      role: 'customer',
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );

  const secondDatabase = testEnvironment
    .authenticatedContext('second-new-customer')
    .firestore();

  await assertFails(
    setDoc(doc(secondDatabase, 'users', 'second-new-customer'), {
      displayName: 'Forged Administrator',
      role: 'admin',
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );

  await assertFails(
    setDoc(doc(secondDatabase, 'users', 'second-new-customer'), {
      displayName: 'Inactive Customer',
      role: 'customer',
      status: 'inactive',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );

  await assertFails(
    setDoc(doc(database, 'users', 'different-user'), {
      displayName: 'Different User',
      role: 'customer',
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
});

test('active staff can create a valid package', async () => {
  const database = testEnvironment.authenticatedContext('staff-a').firestore();

  await assertSucceeds(
    setDoc(doc(database, 'packages', 'staff-package'), {
      name: 'Staff Package',
      description: 'Created by authorized staff.',
      priceInCentavos: 300000,
      menuHighlights: ['Main dish'],
      isActive: true,
      sortOrder: 4,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
});

test('an administrator cannot change their own role or access status', async () => {
  const database = testEnvironment.authenticatedContext('admin-a').firestore();

  await assertFails(
    updateDoc(doc(database, 'users', 'admin-a'), {
      role: 'customer',
      status: 'inactive',
      updatedAt: serverTimestamp(),
    }),
  );
});

test('an administrator cannot change another user access without a matching audit record', async () => {
  const database = testEnvironment.authenticatedContext('admin-a').firestore();

  await assertFails(
    updateDoc(doc(database, 'users', 'customer-a'), {
      role: 'staff',
      status: 'active',
      lastAccessEventId: 'missing-event',
      updatedAt: serverTimestamp(),
    }),
  );
});

test('a standalone or forged access event cannot be created', async () => {
  const database = testEnvironment.authenticatedContext('admin-a').firestore();

  await assertFails(
    setDoc(doc(database, 'userAccessEvents', 'forged-event'), {
      targetUserId: 'customer-a',
      targetDisplayName: 'Customer A',
      previousRole: 'customer',
      newRole: 'admin',
      previousStatus: 'active',
      newStatus: 'active',
      changedBy: 'admin-a',
      changedByName: 'Admin A',
      createdAt: serverTimestamp(),
    }),
  );
});

test('an administrator can atomically manage another user access with an immutable audit record', async () => {
  const { database, eventId } = await recordAccessChange();

  await assertSucceeds(getDoc(doc(database, 'userAccessEvents', eventId)));
  await assertFails(
    updateDoc(doc(database, 'userAccessEvents', eventId), {
      newRole: 'admin',
    }),
  );
  await assertFails(deleteDoc(doc(database, 'userAccessEvents', eventId)));
});

test('access audit records are private to active administrators', async () => {
  const { eventId } = await recordAccessChange('private-access-event');
  const staffDatabase = testEnvironment.authenticatedContext('staff-a').firestore();
  const customerDatabase = testEnvironment.authenticatedContext('customer-b').firestore();
  const suspendedAdminDatabase = testEnvironment.authenticatedContext('suspended-admin').firestore();

  for (const database of [staffDatabase, customerDatabase, suspendedAdminDatabase]) {
    await assertFails(getDoc(doc(database, 'userAccessEvents', eventId)));
    await assertFails(
      getDocs(query(collection(database, 'userAccessEvents'), orderBy('createdAt', 'desc'), limit(10))),
    );
  }
});

test('package records are retained and cannot be hard-deleted by administrators', async () => {
  const database = testEnvironment.authenticatedContext('admin-a').firestore();

  await assertFails(deleteDoc(doc(database, 'packages', 'inactive-package')));
});

test('suspended administrators cannot use administrator package access', async () => {
  const database = testEnvironment
    .authenticatedContext('suspended-admin')
    .firestore();

  await assertFails(getDoc(doc(database, 'packages', 'inactive-package')));
});
