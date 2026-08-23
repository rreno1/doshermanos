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
const projectId = 'demo-dos-hermanos-inventory';

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

function inventoryItem(overrides = {}) {
  const timestamp = Timestamp.fromMillis(1_700_000_000_000);

  return {
    name: 'Disposable Plates',
    unit: 'pieces',
    quantity: 10,
    lowStockThreshold: 5,
    isActive: true,
    lastMovementId: null,
    createdAt: timestamp,
    updatedAt: timestamp,
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
    await setDoc(doc(database, 'inventory', 'plates'), inventoryItem());
    await setDoc(
      doc(database, 'inventory', 'inactive-item'),
      inventoryItem({ name: 'Inactive Item', isActive: false }),
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

test('inventory is private to active staff and administrators', async () => {
  const publicDatabase = testEnvironment.unauthenticatedContext().firestore();
  const customerDatabase = testEnvironment.authenticatedContext('customer-a').firestore();
  const staffDatabase = testEnvironment.authenticatedContext('staff-a').firestore();
  const suspendedDatabase = testEnvironment.authenticatedContext('suspended-staff').firestore();

  await assertFails(getDoc(doc(publicDatabase, 'inventory', 'plates')));
  await assertFails(getDoc(doc(customerDatabase, 'inventory', 'plates')));
  await assertFails(getDoc(doc(suspendedDatabase, 'inventory', 'plates')));
  await assertSucceeds(getDocs(collection(staffDatabase, 'inventory')));
});

test('staff can create an item only with zero starting quantity', async () => {
  const database = testEnvironment.authenticatedContext('staff-a').firestore();

  await assertSucceeds(
    setDoc(doc(database, 'inventory', 'cups'), {
      name: 'Paper Cups',
      unit: 'pieces',
      quantity: 0,
      lowStockThreshold: 100,
      isActive: true,
      lastMovementId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );

  await assertFails(
    setDoc(doc(database, 'inventory', 'forged-opening-stock'), {
      name: 'Forks',
      unit: 'pieces',
      quantity: 500,
      lowStockThreshold: 100,
      isActive: true,
      lastMovementId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
});

test('staff can edit inventory settings without altering stock history fields', async () => {
  const database = testEnvironment.authenticatedContext('staff-a').firestore();

  await assertSucceeds(
    updateDoc(doc(database, 'inventory', 'plates'), {
      name: 'Dinner Plates',
      unit: 'pieces',
      lowStockThreshold: 8,
      isActive: false,
      updatedAt: serverTimestamp(),
    }),
  );

  await assertFails(
    updateDoc(doc(database, 'inventory', 'plates'), {
      lastMovementId: 'fake-movement',
      updatedAt: serverTimestamp(),
    }),
  );
});

test('quantity cannot be changed without a matching movement record', async () => {
  const database = testEnvironment.authenticatedContext('staff-a').firestore();

  await assertFails(
    updateDoc(doc(database, 'inventory', 'plates'), {
      quantity: 15,
      updatedAt: serverTimestamp(),
    }),
  );
});

test('staff can atomically add stock with a matching movement record', async () => {
  const database = testEnvironment.authenticatedContext('staff-a').firestore();
  const batch = writeBatch(database);

  batch.update(doc(database, 'inventory', 'plates'), {
    quantity: 15,
    lastMovementId: 'movement-in',
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(database, 'inventoryMovements', 'movement-in'), {
    inventoryItemId: 'plates',
    itemName: 'Disposable Plates',
    unit: 'pieces',
    type: 'stock_in',
    quantityChange: 5,
    previousQuantity: 10,
    newQuantity: 15,
    note: 'Supplier delivery',
    recordedBy: 'staff-a',
    recordedByName: 'Staff A',
    createdAt: serverTimestamp(),
  });

  await assertSucceeds(batch.commit());
});

test('inactive items cannot receive stock movements', async () => {
  const database = testEnvironment.authenticatedContext('staff-a').firestore();
  const batch = writeBatch(database);

  batch.update(doc(database, 'inventory', 'inactive-item'), {
    quantity: 15,
    lastMovementId: 'inactive-movement',
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(database, 'inventoryMovements', 'inactive-movement'), {
    inventoryItemId: 'inactive-item',
    itemName: 'Inactive Item',
    unit: 'pieces',
    type: 'stock_in',
    quantityChange: 5,
    previousQuantity: 10,
    newQuantity: 15,
    note: '',
    recordedBy: 'staff-a',
    recordedByName: 'Staff A',
    createdAt: serverTimestamp(),
  });

  await assertFails(batch.commit());
});

test('movement record cannot forge quantities or recorder identity', async () => {
  const database = testEnvironment.authenticatedContext('staff-a').firestore();

  const forgedQuantityBatch = writeBatch(database);
  forgedQuantityBatch.update(doc(database, 'inventory', 'plates'), {
    quantity: 15,
    lastMovementId: 'forged-quantity',
    updatedAt: serverTimestamp(),
  });
  forgedQuantityBatch.set(doc(database, 'inventoryMovements', 'forged-quantity'), {
    inventoryItemId: 'plates',
    itemName: 'Disposable Plates',
    unit: 'pieces',
    type: 'stock_in',
    quantityChange: 7,
    previousQuantity: 10,
    newQuantity: 17,
    note: '',
    recordedBy: 'staff-a',
    recordedByName: 'Staff A',
    createdAt: serverTimestamp(),
  });
  await assertFails(forgedQuantityBatch.commit());

  const forgedRecorderBatch = writeBatch(database);
  forgedRecorderBatch.update(doc(database, 'inventory', 'plates'), {
    quantity: 15,
    lastMovementId: 'forged-recorder',
    updatedAt: serverTimestamp(),
  });
  forgedRecorderBatch.set(doc(database, 'inventoryMovements', 'forged-recorder'), {
    inventoryItemId: 'plates',
    itemName: 'Disposable Plates',
    unit: 'pieces',
    type: 'stock_in',
    quantityChange: 5,
    previousQuantity: 10,
    newQuantity: 15,
    note: '',
    recordedBy: 'admin-a',
    recordedByName: 'Admin A',
    createdAt: serverTimestamp(),
  });
  await assertFails(forgedRecorderBatch.commit());
});

test('stock cannot be removed below zero', async () => {
  const database = testEnvironment.authenticatedContext('staff-a').firestore();
  const batch = writeBatch(database);

  batch.update(doc(database, 'inventory', 'plates'), {
    quantity: -1,
    lastMovementId: 'negative-stock',
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(database, 'inventoryMovements', 'negative-stock'), {
    inventoryItemId: 'plates',
    itemName: 'Disposable Plates',
    unit: 'pieces',
    type: 'stock_out',
    quantityChange: -11,
    previousQuantity: 10,
    newQuantity: -1,
    note: '',
    recordedBy: 'staff-a',
    recordedByName: 'Staff A',
    createdAt: serverTimestamp(),
  });

  await assertFails(batch.commit());
});

test('corrections require an explanation and remain linked to the item change', async () => {
  const database = testEnvironment.authenticatedContext('admin-a').firestore();

  const missingNoteBatch = writeBatch(database);
  missingNoteBatch.update(doc(database, 'inventory', 'plates'), {
    quantity: 8,
    lastMovementId: 'correction-no-note',
    updatedAt: serverTimestamp(),
  });
  missingNoteBatch.set(doc(database, 'inventoryMovements', 'correction-no-note'), {
    inventoryItemId: 'plates',
    itemName: 'Disposable Plates',
    unit: 'pieces',
    type: 'correction',
    quantityChange: -2,
    previousQuantity: 10,
    newQuantity: 8,
    note: '',
    recordedBy: 'admin-a',
    recordedByName: 'Admin A',
    createdAt: serverTimestamp(),
  });
  await assertFails(missingNoteBatch.commit());

  const validCorrectionBatch = writeBatch(database);
  validCorrectionBatch.update(doc(database, 'inventory', 'plates'), {
    quantity: 8,
    lastMovementId: 'correction-valid',
    updatedAt: serverTimestamp(),
  });
  validCorrectionBatch.set(doc(database, 'inventoryMovements', 'correction-valid'), {
    inventoryItemId: 'plates',
    itemName: 'Disposable Plates',
    unit: 'pieces',
    type: 'correction',
    quantityChange: -2,
    previousQuantity: 10,
    newQuantity: 8,
    note: 'Physical count correction',
    recordedBy: 'admin-a',
    recordedByName: 'Admin A',
    createdAt: serverTimestamp(),
  });
  await assertSucceeds(validCorrectionBatch.commit());
});

test('customers cannot read inventory movement history', async () => {
  const customerDatabase = testEnvironment.authenticatedContext('customer-a').firestore();
  const staffDatabase = testEnvironment.authenticatedContext('staff-a').firestore();

  await assertFails(getDocs(collection(customerDatabase, 'inventoryMovements')));
  await assertSucceeds(getDocs(collection(staffDatabase, 'inventoryMovements')));
});
