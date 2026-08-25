import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { firestore } from '../../firebase/firebase';
import { parseEquipmentItem, requireInteger } from './equipment.parsers';
import type {
  EquipmentItem,
  EquipmentItemEditInput,
  EquipmentItemInput,
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
        onItems(snapshot.docs.map(parseEquipmentItem).filter((item) => !item.isDeleted));
      } catch {
        onError();
      }
    },
    onError,
  );
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
    isDeleted: false,
    lastTransactionId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateEquipmentItem(
  equipmentId: string,
  input: EquipmentItemEditInput,
) {
  const equipmentRef = doc(firestore, 'equipment', equipmentId);

  await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(equipmentRef);
    if (!snapshot.exists()) {
      throw new Error('Equipment item could not be found.');
    }

    const current = snapshot.data();
    if (current.isDeleted === true) {
      throw new Error('Deleted equipment cannot be edited.');
    }

    const inUse = requireInteger(current.inUseQuantity, 'Equipment usage count is invalid.');
    const damaged = requireInteger(current.damagedQuantity, 'Equipment damage count is invalid.');
    const missing = requireInteger(current.missingQuantity, 'Equipment missing count is invalid.');
    const unavailableQuantity = inUse + damaged + missing;

    if (input.totalQuantity < unavailableQuantity) {
      throw new Error(
        `Total quantity cannot be lower than ${unavailableQuantity} while units are in use, damaged, or missing.`,
      );
    }

    if (!input.isActive && inUse > 0) {
      throw new Error('Equipment currently in use cannot be made inactive.');
    }

    transaction.update(equipmentRef, {
      name: input.name.trim(),
      unit: input.unit.trim(),
      totalQuantity: input.totalQuantity,
      availableQuantity: input.totalQuantity - unavailableQuantity,
      isActive: input.isActive,
      isDeleted: false,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function deleteEquipmentItem(equipmentId: string) {
  const equipmentRef = doc(firestore, 'equipment', equipmentId);

  await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(equipmentRef);
    if (!snapshot.exists()) {
      throw new Error('Equipment item could not be found.');
    }

    const current = snapshot.data();
    if (current.isDeleted === true) {
      return;
    }

    const inUse = requireInteger(current.inUseQuantity, 'Equipment usage count is invalid.');
    if (inUse > 0) {
      throw new Error('Return all equipment currently in use before deleting this registry entry.');
    }

    transaction.update(equipmentRef, {
      isActive: false,
      isDeleted: true,
      updatedAt: serverTimestamp(),
    });
  });
}
