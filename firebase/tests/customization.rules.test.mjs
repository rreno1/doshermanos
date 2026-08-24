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
  doc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const rulesPath = resolve(currentDirectory, '../firestore.rules');
const projectId = 'demo-dos-hermanos-customization';

let testEnvironment;

function profile(displayName, role) {
  const timestamp = Timestamp.fromMillis(1_700_000_000_000);
  return {
    displayName,
    role,
    status: 'active',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function packageRecord() {
  const timestamp = Timestamp.fromMillis(1_700_000_000_000);
  return {
    name: 'Celebration Package',
    description: 'Package for customization tests',
    priceInCentavos: 250000,
    menuHighlights: ['Main dish', 'Dessert'],
    isActive: true,
    sortOrder: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function reservation(customization) {
  const eventDate = Timestamp.fromDate(new Date(Date.UTC(2099, 5, 10)));
  const record = {
    customerId: 'customer-a',
    status: 'pending_review',
    event: {
      startDate: eventDate,
      endDate: eventDate,
      location: 'Hilongos, Leyte',
      guestCount: 120,
      serviceRequirements: 'Outdoor setup',
    },
    package: {
      packageId: 'package-a',
      packageName: 'Celebration Package',
      priceInCentavos: 250000,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (customization !== undefined) {
    record.customization = customization;
  }

  return record;
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
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore();
    await setDoc(doc(database, 'users', 'customer-a'), profile('Customer A', 'customer'));
    await setDoc(doc(database, 'users', 'staff-a'), profile('Staff A', 'staff'));
    await setDoc(doc(database, 'packages', 'package-a'), packageRecord());
  });
});

after(async () => {
  await testEnvironment.cleanup();
});

test('customer can submit bounded package customization requests', async () => {
  const database = testEnvironment.authenticatedContext('customer-a').firestore();

  await assertSucceeds(
    setDoc(
      doc(database, 'reservations', 'customized-request'),
      reservation({
        menuRequest: 'Chicken and fish',
        foodQuantityRequest: 'Additional servings for 10 guests',
        supplyRequest: 'Extra serving trays',
      }),
    ),
  );
});

test('existing reservation shape without customization remains valid', async () => {
  const database = testEnvironment.authenticatedContext('customer-a').firestore();
  await assertSucceeds(
    setDoc(doc(database, 'reservations', 'legacy-shape-request'), reservation(undefined)),
  );
});

test('customization request text is bounded', async () => {
  const database = testEnvironment.authenticatedContext('customer-a').firestore();

  await assertFails(
    setDoc(
      doc(database, 'reservations', 'oversized-customization'),
      reservation({
        menuRequest: 'x'.repeat(1001),
        foodQuantityRequest: '',
        supplyRequest: '',
      }),
    ),
  );
});

test('customer cannot submit a client-approved customized total', async () => {
  const database = testEnvironment.authenticatedContext('customer-a').firestore();

  await assertFails(
    setDoc(
      doc(database, 'reservations', 'forged-custom-total'),
      reservation({
        menuRequest: '',
        foodQuantityRequest: '',
        supplyRequest: '',
        totalPriceInCentavos: 1,
      }),
    ),
  );
});
