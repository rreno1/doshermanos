import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { firestore } from '@core/firebase/firebase';
import type {
  CateringPackage,
  ManagedCateringPackage,
  PackageInput,
} from './package.types';

const PUBLIC_PACKAGE_LIMIT = 24;
const MANAGEMENT_PACKAGE_LIMIT = 100;

function parsePackageDocument(
  document: QueryDocumentSnapshot<DocumentData>,
): CateringPackage {
  const packageData = document.data();

  if (
    typeof packageData.name !== 'string' ||
    typeof packageData.description !== 'string' ||
    !Number.isInteger(packageData.priceInCentavos) ||
    !Array.isArray(packageData.menuHighlights) ||
    !packageData.menuHighlights.every(
      (menuItem: unknown) => typeof menuItem === 'string',
    ) ||
    !Number.isInteger(packageData.sortOrder)
  ) {
    throw new Error('Package data is invalid.');
  }

  return {
    id: document.id,
    name: packageData.name,
    description: packageData.description,
    priceInCentavos: packageData.priceInCentavos,
    menuHighlights: packageData.menuHighlights,
    sortOrder: packageData.sortOrder,
  };
}

function parseManagedPackageDocument(
  document: QueryDocumentSnapshot<DocumentData>,
): ManagedCateringPackage {
  const basePackage = parsePackageDocument(document);
  const packageData = document.data();

  if (typeof packageData.isActive !== 'boolean') {
    throw new Error('Package status is invalid.');
  }

  return {
    ...basePackage,
    isActive: packageData.isActive,
  };
}

export async function loadActivePackages(): Promise<CateringPackage[]> {
  const packagesQuery = query(
    collection(firestore, 'packages'),
    where('isActive', '==', true),
    limit(PUBLIC_PACKAGE_LIMIT),
  );

  const packageSnapshot = await getDocs(packagesQuery);

  return packageSnapshot.docs
    .map(parsePackageDocument)
    .sort((leftPackage, rightPackage) => leftPackage.sortOrder - rightPackage.sortOrder);
}

export async function loadManagedPackages(): Promise<ManagedCateringPackage[]> {
  const packagesQuery = query(
    collection(firestore, 'packages'),
    limit(MANAGEMENT_PACKAGE_LIMIT),
  );
  const packageSnapshot = await getDocs(packagesQuery);

  return packageSnapshot.docs
    .map(parseManagedPackageDocument)
    .sort((leftPackage, rightPackage) => {
      if (leftPackage.sortOrder !== rightPackage.sortOrder) {
        return leftPackage.sortOrder - rightPackage.sortOrder;
      }

      return leftPackage.name.localeCompare(rightPackage.name);
    });
}

export async function createManagedPackage(input: PackageInput): Promise<void> {
  await addDoc(collection(firestore, 'packages'), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateManagedPackage(
  packageId: string,
  input: PackageInput,
): Promise<void> {
  await updateDoc(doc(firestore, 'packages', packageId), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

export async function setManagedPackageActive(
  packageId: string,
  isActive: boolean,
): Promise<void> {
  await updateDoc(doc(firestore, 'packages', packageId), {
    isActive,
    updatedAt: serverTimestamp(),
  });
}
