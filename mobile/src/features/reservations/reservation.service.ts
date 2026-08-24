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
  ReservationCustomizationRequest,
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

function dateOnlyToTimestamp(value: string): Timestamp {
  const [yearText, monthText, dayText] = value.split('-');
  const date = new Date(
    Date.UTC(Number(yearText), Number(monthText) - 1, Number(dayText)),
  );

  return Timestamp.fromDate(date);
}

function parseCustomizationRequest(value: unknown): ReservationCustomizationRequest {
  if (value === undefined) {
    return {
      menuRequest: '',
      foodQuantityRequest: '',
      supplyRequest: '',
    };
  }

  if (!value || typeof value !== 'object') {
    throw new Error('Reservation customization data is invalid.');
  }

  const customization = value as Record<string, unknown>;

  if (
    typeof customization.menuRequest !== 'string' ||
    typeof customization.foodQuantityRequest !== 'string' ||
    typeof customization.supplyRequest !== 'string'
  ) {
    throw new Error('Reservation customization data is invalid.');
  }

  return {
    menuRequest: customization.menuRequest,
    foodQuantityRequest: customization.foodQuantityRequest,
    supplyRequest: customization.supplyRequest,
  };
}

function parseReservationDocument(
  document: QueryDocumentSnapshot<DocumentData>,
): ReservationRecord {
  const value = document.data();
  const event = value.event;
  const packageSnapshot = value.package;

  if (
    !event ||
    typeof event !== 'object' ||
    !packageSnapshot ||
    typeof packageSnapshot !== 'object' ||
    !reservationStatuses.includes(value.status as ReservationStatus) ||
    !(event.startDate instanceof Timestamp) ||
    !(event.endDate instanceof Timestamp) ||
    typeof event.location !== 'string' ||
    !Number.isInteger(event.guestCount) ||
    typeof event.serviceRequirements !== 'string' ||
    typeof packageSnapshot.packageId !== 'string' ||
    typeof packageSnapshot.packageName !== 'string' ||
    !Number.isInteger(packageSnapshot.priceInCentavos) ||
    !(value.createdAt instanceof Timestamp)
  ) {
    throw new Error('Reservation data is invalid.');
  }

  return {
    id: document.id,
    status: value.status as ReservationStatus,
    event: {
      startDate: event.startDate.toDate(),
      endDate: event.endDate.toDate(),
      location: event.location,
      guestCount: event.guestCount,
      serviceRequirements: event.serviceRequirements,
    },
    package: {
      packageId: packageSnapshot.packageId,
      packageName: packageSnapshot.packageName,
      priceInCentavos: packageSnapshot.priceInCentavos,
    },
    customization: parseCustomizationRequest(value.customization),
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
    event: {
      startDate: dateOnlyToTimestamp(input.startDate),
      endDate: dateOnlyToTimestamp(input.endDate),
      location: input.location,
      guestCount: input.guestCount,
      serviceRequirements: input.serviceRequirements,
    },
    package: {
      packageId: cateringPackage.id,
      packageName: cateringPackage.name,
      priceInCentavos: cateringPackage.priceInCentavos,
    },
    customization: input.customization,
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
      try {
        onReservations(snapshot.docs.map(parseReservationDocument));
      } catch {
        onError();
      }
    },
    onError,
  );
}
