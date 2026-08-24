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
const projectId = 'demo-dos-hermanos-payments';

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

function reservationRecord(customerId, status = 'pending_review') {
  const timestamp = Timestamp.fromMillis(1_700_000_000_000);
  const eventDate = Timestamp.fromDate(new Date(Date.UTC(2026, 11, 12)));

  return {
    customerId,
    status,
    event: {
      startDate: eventDate,
      endDate: eventDate,
      location: 'Hilongos, Leyte',
      guestCount: 100,
      serviceRequirements: '',
    },
    package: {
      packageId: 'package-a',
      packageName: 'Celebration Package',
      priceInCentavos: 250000,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function paymentRecord(overrides = {}) {
  return {
    reservationId: 'reservation-a',
    customerId: 'customer-a',
    packageName: 'Celebration Package',
    eventStartDate: Timestamp.fromDate(new Date(Date.UTC(2026, 11, 12))),
    amountInCentavos: 50000,
    method: 'cash',
    reference: 'OR-001',
    note: 'Received at the office',
    recordedBy: 'staff-a',
    recordedByName: 'Staff A',
    createdAt: serverTimestamp(),
    ...overrides,
  };
}

function receiptRecord(overrides = {}) {
  return {
    reservationId: 'reservation-a',
    customerId: 'customer-a',
    packageName: 'Celebration Package',
    eventStartDate: Timestamp.fromDate(new Date(Date.UTC(2026, 11, 12))),
    amountInCentavos: 50000,
    method: 'cash',
    reference: 'OR-001',
    createdAt: serverTimestamp(),
    ...overrides,
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
      doc(database, 'users', 'suspended-staff'),
      userProfile('Suspended Staff', 'staff', 'suspended'),
    );
    await setDoc(
      doc(database, 'reservations', 'reservation-a'),
      reservationRecord('customer-a'),
    );
    await setDoc(
      doc(database, 'reservations', 'rejected-reservation'),
      reservationRecord('customer-a', 'rejected'),
    );
  });
}

async function seedPaymentPair(paymentId = 'payment-a') {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore();
    const timestamp = Timestamp.fromMillis(1_700_000_100_000);

    await setDoc(doc(database, 'payments', paymentId), {
      ...paymentRecord(),
      createdAt: timestamp,
    });
    await setDoc(doc(database, 'paymentReceipts', paymentId), {
      ...receiptRecord(),
      createdAt: timestamp,
    });
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

test('private payment records are visible only to active staff and administrators', async () => {
  await seedPaymentPair();

  const publicDatabase = testEnvironment.unauthenticatedContext().firestore();
  const customerDatabase = testEnvironment.authenticatedContext('customer-a').firestore();
  const staffDatabase = testEnvironment.authenticatedContext('staff-a').firestore();
  const suspendedDatabase = testEnvironment.authenticatedContext('suspended-staff').firestore();

  await assertFails(getDoc(doc(publicDatabase, 'payments', 'payment-a')));
  await assertFails(getDoc(doc(customerDatabase, 'payments', 'payment-a')));
  await assertFails(getDoc(doc(suspendedDatabase, 'payments', 'payment-a')));
  await assertSucceeds(getDocs(collection(staffDatabase, 'payments')));
});

test('customer can read only their own safe payment receipt', async () => {
  await seedPaymentPair();

  const customerADatabase = testEnvironment.authenticatedContext('customer-a').firestore();
  const customerBDatabase = testEnvironment.authenticatedContext('customer-b').firestore();

  await assertSucceeds(getDoc(doc(customerADatabase, 'paymentReceipts', 'payment-a')));
  await assertFails(getDoc(doc(customerBDatabase, 'paymentReceipts', 'payment-a')));
});

test('staff can atomically create a cash payment and matching customer receipt', async () => {
  const database = testEnvironment.authenticatedContext('staff-a').firestore();
  const batch = writeBatch(database);

  batch.set(doc(database, 'payments', 'cash-1'), paymentRecord());
  batch.set(doc(database, 'paymentReceipts', 'cash-1'), receiptRecord());

  await assertSucceeds(batch.commit());
});

test('payment cannot be created without its matching customer receipt', async () => {
  const database = testEnvironment.authenticatedContext('staff-a').firestore();

  await assertFails(setDoc(doc(database, 'payments', 'missing-receipt'), paymentRecord()));
});

test('receipt cannot be created without its matching private payment', async () => {
  const database = testEnvironment.authenticatedContext('staff-a').firestore();

  await assertFails(
    setDoc(doc(database, 'paymentReceipts', 'missing-payment'), receiptRecord()),
  );
});

test('customer cannot create payment records or receipts', async () => {
  const database = testEnvironment.authenticatedContext('customer-a').firestore();
  const batch = writeBatch(database);

  batch.set(
    doc(database, 'payments', 'customer-forged'),
    paymentRecord({ recordedBy: 'customer-a', recordedByName: 'Customer A' }),
  );
  batch.set(doc(database, 'paymentReceipts', 'customer-forged'), receiptRecord());

  await assertFails(batch.commit());
});

test('staff cannot forge recorder identity', async () => {
  const database = testEnvironment.authenticatedContext('staff-a').firestore();
  const batch = writeBatch(database);

  batch.set(
    doc(database, 'payments', 'forged-recorder'),
    paymentRecord({ recordedBy: 'admin-a', recordedByName: 'Admin A' }),
  );
  batch.set(doc(database, 'paymentReceipts', 'forged-recorder'), receiptRecord());

  await assertFails(batch.commit());
});

test('payment and customer receipt must agree on amount and reservation context', async () => {
  const database = testEnvironment.authenticatedContext('staff-a').firestore();

  const forgedAmountBatch = writeBatch(database);
  forgedAmountBatch.set(doc(database, 'payments', 'forged-amount'), paymentRecord());
  forgedAmountBatch.set(
    doc(database, 'paymentReceipts', 'forged-amount'),
    receiptRecord({ amountInCentavos: 1 }),
  );
  await assertFails(forgedAmountBatch.commit());

  const forgedCustomerBatch = writeBatch(database);
  forgedCustomerBatch.set(
    doc(database, 'payments', 'forged-customer'),
    paymentRecord({ customerId: 'customer-b' }),
  );
  forgedCustomerBatch.set(
    doc(database, 'paymentReceipts', 'forged-customer'),
    receiptRecord({ customerId: 'customer-b' }),
  );
  await assertFails(forgedCustomerBatch.commit());
});

test('payments must reference an eligible reservation and match its snapshots', async () => {
  const database = testEnvironment.authenticatedContext('staff-a').firestore();

  const rejectedBatch = writeBatch(database);
  rejectedBatch.set(
    doc(database, 'payments', 'rejected-payment'),
    paymentRecord({ reservationId: 'rejected-reservation' }),
  );
  rejectedBatch.set(
    doc(database, 'paymentReceipts', 'rejected-payment'),
    receiptRecord({ reservationId: 'rejected-reservation' }),
  );
  await assertFails(rejectedBatch.commit());

  const forgedPackageBatch = writeBatch(database);
  forgedPackageBatch.set(
    doc(database, 'payments', 'forged-package'),
    paymentRecord({ packageName: 'Different Package' }),
  );
  forgedPackageBatch.set(
    doc(database, 'paymentReceipts', 'forged-package'),
    receiptRecord({ packageName: 'Different Package' }),
  );
  await assertFails(forgedPackageBatch.commit());
});

test('only positive cash amounts are accepted in this payment slice', async () => {
  const database = testEnvironment.authenticatedContext('staff-a').firestore();

  const zeroAmountBatch = writeBatch(database);
  zeroAmountBatch.set(
    doc(database, 'payments', 'zero-payment'),
    paymentRecord({ amountInCentavos: 0 }),
  );
  zeroAmountBatch.set(
    doc(database, 'paymentReceipts', 'zero-payment'),
    receiptRecord({ amountInCentavos: 0 }),
  );
  await assertFails(zeroAmountBatch.commit());

  const onlineMethodBatch = writeBatch(database);
  onlineMethodBatch.set(
    doc(database, 'payments', 'online-payment'),
    paymentRecord({ method: 'payment_link' }),
  );
  onlineMethodBatch.set(
    doc(database, 'paymentReceipts', 'online-payment'),
    receiptRecord({ method: 'payment_link' }),
  );
  await assertFails(onlineMethodBatch.commit());
});

test('payment records and customer receipts are append-only', async () => {
  await seedPaymentPair();
  const database = testEnvironment.authenticatedContext('admin-a').firestore();

  await assertFails(
    updateDoc(doc(database, 'payments', 'payment-a'), {
      amountInCentavos: 75000,
    }),
  );
  await assertFails(
    updateDoc(doc(database, 'paymentReceipts', 'payment-a'), {
      amountInCentavos: 75000,
    }),
  );
});

test('an existing payment operation id cannot be rewritten as a second payment', async () => {
  await seedPaymentPair('retry-a');
  const database = testEnvironment.authenticatedContext('staff-a').firestore();
  const batch = writeBatch(database);

  batch.set(doc(database, 'payments', 'retry-a'), paymentRecord());
  batch.set(doc(database, 'paymentReceipts', 'retry-a'), receiptRecord());

  await assertFails(batch.commit());
});
