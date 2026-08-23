import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { firestore } from '../../firebase/firebase';
import type { CateringPackage } from './package.types';

const PACKAGE_LIMIT = 24;

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

export async function loadActivePackages(): Promise<CateringPackage[]> {
  const packagesQuery = query(
    collection(firestore, 'packages'),
    where('isActive', '==', true),
    orderBy('sortOrder', 'asc'),
    limit(PACKAGE_LIMIT),
  );

  const packageSnapshot = await getDocs(packagesQuery);

  return packageSnapshot.docs.map(parsePackageDocument);
}
