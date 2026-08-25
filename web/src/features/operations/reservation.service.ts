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
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from '../../firebase/firebase';
import type { CateringPackage } from './package.types';
import type {
  ManualReservationCustomer,
  ReservationCustomizationRequest,
  ReservationDecision,
  ReservationEnteredBy,
  ReservationRecord,
  ReservationRequestInput,
  ReservationSource,
  ReservationStatus,
} from './reservation.types';

const CUSTOMER_RESERVATION_LIMIT = 20;
const STAFF_REVIEW_LIMIT = 50;
const RESERVATION_DECISION_LIMIT = 40;
const reservationStatuses: ReservationStatus[] = [
  'pending_review',
  'confirmed',
  'rejected',
  'cancelled',
  'completed',
];

type ReservationAttribution = {
  source: ReservationSource;
  manualCustomer: ManualReservationCustomer | null;
  enteredBy: ReservationEnteredBy | null;
};

function dateOnlyToTimestamp(value: string): Timestamp {
  const [yearText, monthText, dayText] = value.split('-');
  const date = new Date(
    Date.UTC(Number(yearText), Number(monthText) - 1, Number(dayText)),
  );

  return Timestamp.fromDate(date);
}

function buildReservationDetails(
  cateringPackage: CateringPackage,
  input: ReservationRequestInput,
) {
  return {
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
  };
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

function parseReservationAttribution(value: DocumentData): ReservationAttribution {
  const hasAttribution = value.source !== undefined
    || value.manualCustomer !== undefined
    || value.enteredBy !== undefined;

  if (!hasAttribution) {
    return {
      source: 'customer_portal',
      manualCustomer: null,
      enteredBy: null,
    };
  }

  const manualCustomer = value.manualCustomer;
  const enteredBy = value.enteredBy;

  if (
    value.source !== 'manual' ||
    !manualCustomer ||
    typeof manualCustomer !== 'object' ||
    typeof manualCustomer.name !== 'string' ||
    typeof manualCustomer.contact !== 'string' ||
    !enteredBy ||
    typeof enteredBy !== 'object' ||
    typeof enteredBy.userId !== 'string' ||
    typeof enteredBy.displayName !== 'string'
  ) {
    throw new Error('Reservation attribution data is invalid.');
  }

  return {
    source: 'manual',
    manualCustomer: {
      name: manualCustomer.name,
      contact: manualCustomer.contact,
    },
    enteredBy: {
      userId: enteredBy.userId,
      displayName: enteredBy.displayName,
    },
  };
}

function parseReservationDocument(
  document: QueryDocumentSnapshot<DocumentData>,
): ReservationRecord {
  const value = document.data({ serverTimestamps: 'estimate' });
  const event = value.event;
  const packageSnapshot = value.package;

  if (
    typeof value.customerId !== 'string' ||
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
    !(value.createdAt instanceof Timestamp) ||
    !(value.updatedAt instanceof Timestamp)
  ) {
    throw new Error('Reservation data is invalid.');
  }

  return {
    id: document.id,
    customerId: value.customerId,
    status: value.status as ReservationStatus,
    ...parseReservationAttribution(value),
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
    updatedAt: value.updatedAt.toDate(),
  };
}

function parseReservationDecisionDocument(
  document: QueryDocumentSnapshot<DocumentData>,
): ReservationDecision {
  const value = document.data({ serverTimestamps: 'estimate' });

  if (
    typeof value.reservationId !== 'string' ||
    typeof value.customerId !== 'string' ||
    value.previousStatus !== 'pending_review' ||
    value.newStatus !== 'rejected' ||
    typeof value.decidedBy !== 'string' ||
    typeof value.decidedByName !== 'string' ||
    !(value.createdAt instanceof Timestamp)
  ) {
    throw new Error('Reservation decision data is invalid.');
  }

  return {
    id: document.id,
    reservationId: value.reservationId,
    customerId: value.customerId,
    previousStatus: 'pending_review',
    newStatus: 'rejected',
    decidedBy: value.decidedBy,
    decidedByName: value.decidedByName,
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
    ...buildReservationDetails(cateringPackage, input),
  });

  return reservationRef.id;
}

export async function createManualReservationRequest(
  enteredById: string,
  enteredByName: string,
  manualCustomer: ManualReservationCustomer,
  cateringPackage: CateringPackage,
  input: ReservationRequestInput,
): Promise<string> {
  const reservationRef = doc(collection(firestore, 'reservations'));

  await setDoc(reservationRef, {
    customerId: `manual:${reservationRef.id}`,
    source: 'manual',
    manualCustomer,
    enteredBy: {
      userId: enteredById,
      displayName: enteredByName,
    },
    ...buildReservationDetails(cateringPackage, input),
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
    limit(CUSTOMER_RESERVATION_LIMIT),
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

export function subscribeToPendingReservations(
  onReservations: (reservations: ReservationRecord[]) => void,
  onError: () => void,
): Unsubscribe {
  const reservationsQuery = query(
    collection(firestore, 'reservations'),
    where('status', '==', 'pending_review'),
    orderBy('createdAt', 'desc'),
    limit(STAFF_REVIEW_LIMIT),
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

export async function rejectReservation(
  reservationId: string,
  decidedBy: string,
  decidedByName: string,
): Promise<void> {
  const reservationRef = doc(firestore, 'reservations', reservationId);
  const decisionRef = doc(firestore, 'reservationDecisions', `${reservationId}-rejected`);

  await runTransaction(firestore, async (transaction) => {
    const reservationSnapshot = await transaction.get(reservationRef);
    const decisionSnapshot = await transaction.get(decisionRef);

    if (!reservationSnapshot.exists()) {
      throw new Error('The reservation request no longer exists.');
    }

    const reservation = reservationSnapshot.data();

    if (reservation.status === 'rejected' && decisionSnapshot.exists()) {
      return;
    }

    if (reservation.status !== 'pending_review') {
      throw new Error('Only pending reservation requests can be rejected.');
    }

    if (decisionSnapshot.exists()) {
      throw new Error('This reservation already has a rejection decision record.');
    }

    if (typeof reservation.customerId !== 'string' || reservation.customerId.length === 0) {
      throw new Error('The reservation customer record is invalid.');
    }

    transaction.update(reservationRef, {
      status: 'rejected',
      updatedAt: serverTimestamp(),
    });
    transaction.set(decisionRef, {
      reservationId,
      customerId: reservation.customerId,
      previousStatus: 'pending_review',
      newStatus: 'rejected',
      decidedBy,
      decidedByName,
      createdAt: serverTimestamp(),
    });
  });
}

export function subscribeToReservationDecisions(
  onDecisions: (decisions: ReservationDecision[]) => void,
  onError: () => void,
): Unsubscribe {
  const decisionsQuery = query(
    collection(firestore, 'reservationDecisions'),
    orderBy('createdAt', 'desc'),
    limit(RESERVATION_DECISION_LIMIT),
  );

  return onSnapshot(
    decisionsQuery,
    (snapshot) => {
      try {
        onDecisions(snapshot.docs.map(parseReservationDecisionDocument));
      } catch {
        onError();
      }
    },
    onError,
  );
}
