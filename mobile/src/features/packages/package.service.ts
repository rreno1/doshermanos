import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  type DocumentData,
} from 'firebase/firestore';
import { firestore } from '../../firebase/firebase';
import type { CateringPackage } from './package.types';

const PACKAGE_LIMIT = 24;

function parsePackageData(id: string, value: DocumentData): CateringPackage {
  if (
    typeof value.name !== 'string' ||
    typeof value.description !== 'string' ||
    !Number.isInteger(value.priceInCentavos) ||
    !Array.isArray(value.menuHighlights) ||
    !value.menuHighlights.every((menuItem: unknown) => typeof menuItem === 'string') ||
    !Number.isInteger(value.sortOrder)
  ) {
    throw new Error('Package data is invalid.');
  }

  return {
    id,
    name: value.name,
    description: value.description,
    priceInCentavos: value.priceInCentavos,
    menuHighlights: value.menuHighlights,
    sortOrder: value.sortOrder,
  };
}

export async function loadActivePackages(): Promise<CateringPackage[]> {
  const packagesQuery = query(
    collection(firestore, 'packages'),
    where('isActive', '==', true),
    orderBy('sortOrder', 'asc'),
    limit(PACKAGE_LIMIT),
  );

  const packageSnapshot = await getDocs(packagesQuery);

  return packageSnapshot.docs.map((document) => parsePackageData(document.id, document.data()));
}

export async function loadActivePackageById(
  packageId: string,
): Promise<CateringPackage | null> {
  const packageSnapshot = await getDoc(doc(firestore, 'packages', packageId));

  if (!packageSnapshot.exists()) {
    return null;
  }

  const value = packageSnapshot.data();

  if (value.isActive !== true) {
    return null;
  }

  return parsePackageData(packageSnapshot.id, value);
}
