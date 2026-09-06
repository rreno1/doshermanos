import {
  Timestamp,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from '@core/firebase/firebase';
import type {
  InventoryItem,
  InventoryItemDetailsInput,
  InventoryMovement,
  InventoryMovementInput,
  InventoryMovementType,
} from './inventory.types';

const maximumInventoryItems = 100;
const maximumRecentMovements = 30;
const knownInventoryMessages = new Set([
  'This inventory item no longer exists.',
  'This inventory item is inactive.',
  'Not enough stock is available for that change.',
  'The recorded quantity already matches the correction.',
]);

export function subscribeToInventory(
  onItems: (items: InventoryItem[]) => void,
  onError: () => void,
): Unsubscribe {
  const inventoryQuery = query(
    collection(firestore, 'inventory'),
    orderBy('name', 'asc'),
    limit(maximumInventoryItems),
  );

  return onSnapshot(
    inventoryQuery,
    (snapshot) => {
      try {
        onItems(snapshot.docs.map(parseInventoryItem));
      } catch {
        onError();
      }
    },
    onError,
  );
}

export function subscribeToRecentInventoryMovements(
  onMovements: (movements: InventoryMovement[]) => void,
  onError: () => void,
): Unsubscribe {
  const movementQuery = query(
    collection(firestore, 'inventoryMovements'),
    orderBy('createdAt', 'desc'),
    limit(maximumRecentMovements),
  );

  return onSnapshot(
    movementQuery,
    (snapshot) => {
      try {
        onMovements(snapshot.docs.map(parseInventoryMovement));
      } catch {
        onError();
      }
    },
    onError,
  );
}

export async function createInventoryItem(
  input: InventoryItemDetailsInput,
): Promise<string> {
  const itemRef = doc(collection(firestore, 'inventory'));

  await setDoc(itemRef, {
    name: input.name,
    unit: input.unit,
    quantity: 0,
    lowStockThreshold: input.lowStockThreshold,
    isActive: true,
    lastMovementId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return itemRef.id;
}

export async function updateInventoryItemDetails(
  inventoryItemId: string,
  input: InventoryItemDetailsInput,
): Promise<void> {
  await updateDoc(doc(firestore, 'inventory', inventoryItemId), {
    name: input.name,
    unit: input.unit,
    lowStockThreshold: input.lowStockThreshold,
    isActive: input.isActive,
    updatedAt: serverTimestamp(),
  });
}

export async function touchInventoryItem(inventoryItemId: string): Promise<void> {
  await updateDoc(doc(firestore, 'inventory', inventoryItemId), {
    updatedAt: serverTimestamp(),
  });
}

export async function recordInventoryMovement(
  inventoryItemId: string,
  input: InventoryMovementInput,
  recordedBy: string,
  recordedByName: string,
): Promise<void> {
  const itemRef = doc(firestore, 'inventory', inventoryItemId);
  const movementRef = doc(collection(firestore, 'inventoryMovements'));

  await runTransaction(firestore, async (transaction) => {
    const itemSnapshot = await transaction.get(itemRef);

    if (!itemSnapshot.exists()) {
      throw new Error('This inventory item no longer exists.');
    }

    const item = parseInventoryItem(itemSnapshot);

    if (!item.isActive) {
      throw new Error('This inventory item is inactive.');
    }

    const newQuantity = calculateNewQuantity(item.quantity, input);
    const quantityChange = newQuantity - item.quantity;

    if (quantityChange === 0) {
      throw new Error('The recorded quantity already matches the correction.');
    }

    transaction.update(itemRef, {
      quantity: newQuantity,
      lastMovementId: movementRef.id,
      updatedAt: serverTimestamp(),
    });

    transaction.set(movementRef, {
      inventoryItemId: item.id,
      itemName: item.name,
      unit: item.unit,
      type: input.type,
      quantityChange,
      previousQuantity: item.quantity,
      newQuantity,
      note: input.note,
      recordedBy,
      recordedByName,
      createdAt: serverTimestamp(),
    });
  });
}

export function getInventoryErrorMessage(error: unknown): string {
  if (error instanceof Error && knownInventoryMessages.has(error.message)) {
    return error.message;
  }

  return 'We could not save that inventory change. Please try again.';
}

function calculateNewQuantity(
  currentQuantity: number,
  input: InventoryMovementInput,
): number {
  if (input.type === 'stock_in') {
    return currentQuantity + input.quantity;
  }

  if (input.type === 'stock_out') {
    const nextQuantity = currentQuantity - input.quantity;

    if (nextQuantity < 0) {
      throw new Error('Not enough stock is available for that change.');
    }

    return nextQuantity;
  }

  return input.quantity;
}

function parseInventoryItem(
  document: QueryDocumentSnapshot<DocumentData> | { id: string; data: () => DocumentData },
): InventoryItem {
  const value = document.data();

  if (
    typeof value.name !== 'string' ||
    typeof value.unit !== 'string' ||
    !Number.isSafeInteger(value.quantity) ||
    value.quantity < 0 ||
    !Number.isSafeInteger(value.lowStockThreshold) ||
    value.lowStockThreshold < 0 ||
    typeof value.isActive !== 'boolean' ||
    !isNullableString(value.lastMovementId)
  ) {
    throw new Error('Inventory data is invalid.');
  }

  return {
    id: document.id,
    name: value.name,
    unit: value.unit,
    quantity: value.quantity,
    lowStockThreshold: value.lowStockThreshold,
    isActive: value.isActive,
    lastMovementId: value.lastMovementId,
    updatedAt: value.updatedAt instanceof Timestamp ? value.updatedAt.toDate() : new Date(),
  };
}

function parseInventoryMovement(
  document: QueryDocumentSnapshot<DocumentData>,
): InventoryMovement {
  const value = document.data({ serverTimestamps: 'estimate' });

  if (
    typeof value.inventoryItemId !== 'string' ||
    typeof value.itemName !== 'string' ||
    typeof value.unit !== 'string' ||
    !isMovementType(value.type) ||
    !Number.isSafeInteger(value.quantityChange) ||
    !Number.isSafeInteger(value.previousQuantity) ||
    !Number.isSafeInteger(value.newQuantity) ||
    typeof value.note !== 'string' ||
    typeof value.recordedByName !== 'string' ||
    !(value.createdAt instanceof Timestamp)
  ) {
    throw new Error('Inventory movement data is invalid.');
  }

  return {
    id: document.id,
    inventoryItemId: value.inventoryItemId,
    itemName: value.itemName,
    unit: value.unit,
    type: value.type,
    quantityChange: value.quantityChange,
    previousQuantity: value.previousQuantity,
    newQuantity: value.newQuantity,
    note: value.note,
    recordedByName: value.recordedByName,
    createdAt: value.createdAt.toDate(),
  };
}

function isMovementType(value: unknown): value is InventoryMovementType {
  return value === 'stock_in' || value === 'stock_out' || value === 'correction';
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}
