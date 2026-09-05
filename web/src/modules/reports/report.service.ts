import {
  Timestamp,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from '@core/firebase/firebase';
import type { ReservationStatus } from '@modules/operations/reservation.types';

const REPORT_ROW_LIMIT = 250;
const reservationStatuses = new Set<ReservationStatus>([
  'pending_review',
  'confirmed',
  'rejected',
  'cancelled',
  'completed',
]);

export type ReportReservation = {
  id: string;
  status: ReservationStatus;
  eventStartDate: Date;
  eventEndDate: Date;
  location: string;
  guestCount: number;
  packageName: string;
  packageBasePriceInCentavos: number;
  createdAt: Date;
};

export type ReportPayment = {
  id: string;
  reservationId: string;
  packageName: string;
  eventStartDate: Date;
  amountInCentavos: number;
  method: string;
  reference: string;
  recordedByName: string;
  createdAt: Date;
};

export function subscribeToReportReservations(
  onReservations: (reservations: ReportReservation[]) => void,
  onError: () => void,
): Unsubscribe {
  const reservationsQuery = query(
    collection(firestore, 'reservations'),
    orderBy('createdAt', 'desc'),
    limit(REPORT_ROW_LIMIT),
  );

  return onSnapshot(
    reservationsQuery,
    (snapshot) => {
      try {
        onReservations(snapshot.docs.map(parseReportReservation));
      } catch {
        onError();
      }
    },
    onError,
  );
}

export function subscribeToReportPayments(
  onPayments: (payments: ReportPayment[]) => void,
  onError: () => void,
): Unsubscribe {
  const paymentsQuery = query(
    collection(firestore, 'payments'),
    orderBy('createdAt', 'desc'),
    limit(REPORT_ROW_LIMIT),
  );

  return onSnapshot(
    paymentsQuery,
    (snapshot) => {
      try {
        onPayments(snapshot.docs.map(parseReportPayment));
      } catch {
        onError();
      }
    },
    onError,
  );
}

function parseReportReservation(
  document: QueryDocumentSnapshot<DocumentData>,
): ReportReservation {
  const value = document.data({ serverTimestamps: 'estimate' });
  const event = value.event;
  const packageSnapshot = value.package;

  if (
    !reservationStatuses.has(value.status as ReservationStatus) ||
    !event ||
    typeof event !== 'object' ||
    !(event.startDate instanceof Timestamp) ||
    !(event.endDate instanceof Timestamp) ||
    typeof event.location !== 'string' ||
    !Number.isSafeInteger(event.guestCount) ||
    !packageSnapshot ||
    typeof packageSnapshot !== 'object' ||
    typeof packageSnapshot.packageName !== 'string' ||
    !Number.isSafeInteger(packageSnapshot.priceInCentavos) ||
    !(value.createdAt instanceof Timestamp)
  ) {
    throw new Error('Reservation report data is invalid.');
  }

  return {
    id: document.id,
    status: value.status as ReservationStatus,
    eventStartDate: event.startDate.toDate(),
    eventEndDate: event.endDate.toDate(),
    location: event.location,
    guestCount: event.guestCount,
    packageName: packageSnapshot.packageName,
    packageBasePriceInCentavos: packageSnapshot.priceInCentavos,
    createdAt: value.createdAt.toDate(),
  };
}

function parseReportPayment(document: QueryDocumentSnapshot<DocumentData>): ReportPayment {
  const value = document.data({ serverTimestamps: 'estimate' });

  if (
    typeof value.reservationId !== 'string' ||
    typeof value.packageName !== 'string' ||
    !(value.eventStartDate instanceof Timestamp) ||
    !Number.isSafeInteger(value.amountInCentavos) ||
    value.amountInCentavos <= 0 ||
    typeof value.method !== 'string' ||
    typeof value.reference !== 'string' ||
    typeof value.recordedByName !== 'string' ||
    !(value.createdAt instanceof Timestamp)
  ) {
    throw new Error('Payment report data is invalid.');
  }

  return {
    id: document.id,
    reservationId: value.reservationId,
    packageName: value.packageName,
    eventStartDate: value.eventStartDate.toDate(),
    amountInCentavos: value.amountInCentavos,
    method: value.method,
    reference: value.reference,
    recordedByName: value.recordedByName,
    createdAt: value.createdAt.toDate(),
  };
}
