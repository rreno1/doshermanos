import {
  Timestamp,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from '../../firebase/firebase';
import type { CateringPackage } from '../packages/package.types';
import type {
  ReservationRecord,
  ReservationRequestInput,
  ReservationStatus,
} from './reservation.types';

const RESERVATION_LIMIT = 20;
const reservationStatuses: ReservationStatus[] = [
  'pending_review',
  'confirmed',
  'rejected',
  'cancelled',
  'completed',
];

function parseReservationDocument(
  document: QueryDocumentSnapshot<DocumentData>,
): ReservationRecord | null {
  const value = document.data();
  const event = value.event;
  const packageSnapshot = value.package;

  if (
    !event ||
    typeof event !== 'object' ||
    !packageSnapshot ||
    typeof packageSnapshot !== 'object' ||
    !reservationStatuses.includes(value.status as ReservationStatus) ||
    typeof event.startDate !== 'string' ||
    typeof event.endDate !== 'string' ||
    typeof event.location !== 'string' ||
    !Number.isInteger(event.guestCount) ||
    typeof event.serviceRequirements !== 'string' ||
    typeof packageSnapshot.packageId !== 'string' ||
    typeof packageSnapshot.packageName !== 'string' ||
    !Number.isInteger(packageSnapshot.priceInCentavos) ||
    !(value.createdAt instanceof Timestamp)
  ) {
    return null;
  }

  return {
    id: document.id,
    status: value.status as ReservationStatus,
    event: {
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      guestCount: event.guestCount,
      serviceRequirements: event.serviceRequirements,
    },
    package: {
      packageId: packageSnapshot.packageId,
      packageName: packageSnapshot.packageName,
      priceInCentavos: packageSnapshot.priceInCentavos,
    },
    createdAt: value.createdAt.toDate(),
  };
}

export async function createReservationRequest(
  customerId: string,
  cateringPackage: CateringPackage,
  input: ReservationRequestInput,
): Promise<string> {
  const reservationRef = doc(collection(firestore, 'reservations'));

  await setDoc(reservationRef, {
    customerId,
    status: 'pending_review',
    event: input,
    package: {
      packageId: cateringPackage.id,
      packageName: cateringPackage.name,
      priceInCentavos: cateringPackage.priceInCentavos,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return reservationRef.id;
}

export function subscribeToOwnReservations(
  customerId: string,
  onReservations: (reservations: ReservationRecord[]) => void,
  onError: () => void,
): Unsubscribe {
  const reservationsQuery = query(
    collection(firestore, 'reservations'),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc'),
    limit(RESERVATION_LIMIT),
  );

  return onSnapshot(
    reservationsQuery,
    (snapshot) => {
      const reservations = snapshot.docs
        .map(parseReservationDocument)
        .filter((reservation): reservation is ReservationRecord => reservation !== null);

      onReservations(reservations);
    },
    onError,
  );
}
