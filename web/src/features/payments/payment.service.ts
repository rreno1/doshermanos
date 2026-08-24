import {
  Timestamp,
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from '../../firebase/firebase';
import type {
  CashPaymentInput,
  PayableReservationStatus,
  PaymentMethod,
  PaymentReceipt,
  PaymentRecord,
  PaymentReservation,
} from './payment.types';

const maximumPayableReservations = 50;
const maximumRecentPayments = 50;
const maximumCustomerReceipts = 30;

const knownPaymentMessages = new Set([
  'This reservation no longer exists.',
  'This reservation is not eligible for payment recording.',
]);

export function subscribeToPayableReservations(
  onReservations: (reservations: PaymentReservation[]) => void,
  onError: () => void,
): Unsubscribe {
  const reservationsQuery = query(
    collection(firestore, 'reservations'),
    orderBy('createdAt', 'desc'),
    limit(maximumPayableReservations),
  );

  return onSnapshot(
    reservationsQuery,
    (snapshot) => {
      try {
        const reservations = snapshot.docs
          .map(parsePaymentReservation)
          .filter((reservation): reservation is PaymentReservation => reservation !== null);
        onReservations(reservations);
      } catch {
        onError();
      }
    },
    onError,
  );
}

export function subscribeToRecentPayments(
  onPayments: (payments: PaymentRecord[]) => void,
  onError: () => void,
): Unsubscribe {
  const paymentsQuery = query(
    collection(firestore, 'payments'),
    orderBy('createdAt', 'desc'),
    limit(maximumRecentPayments),
  );

  return onSnapshot(
    paymentsQuery,
    (snapshot) => {
      try {
        onPayments(snapshot.docs.map(parsePaymentRecord));
      } catch {
        onError();
      }
    },
    onError,
  );
}

export function subscribeToOwnPaymentReceipts(
  customerId: string,
  onReceipts: (receipts: PaymentReceipt[]) => void,
  onError: () => void,
): Unsubscribe {
  const receiptsQuery = query(
    collection(firestore, 'paymentReceipts'),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc'),
    limit(maximumCustomerReceipts),
  );

  return onSnapshot(
    receiptsQuery,
    (snapshot) => {
      try {
        onReceipts(snapshot.docs.map(parsePaymentReceipt));
      } catch {
        onError();
      }
    },
    onError,
  );
}

export function createPaymentId(): string {
  return doc(collection(firestore, 'payments')).id;
}

export async function recordCashPayment(
  paymentId: string,
  reservationId: string,
  input: CashPaymentInput,
  recordedBy: string,
  recordedByName: string,
): Promise<void> {
  const reservationRef = doc(firestore, 'reservations', reservationId);
  const reservationSnapshot = await getDoc(reservationRef);

  if (!reservationSnapshot.exists()) {
    throw new Error('This reservation no longer exists.');
  }

  const reservation = parsePaymentReservation(reservationSnapshot);

  if (!reservation) {
    throw new Error('This reservation is not eligible for payment recording.');
  }

  const paymentRef = doc(firestore, 'payments', paymentId);
  const receiptRef = doc(firestore, 'paymentReceipts', paymentId);
  const batch = writeBatch(firestore);

  batch.set(paymentRef, {
    reservationId: reservation.id,
    customerId: reservation.customerId,
    packageName: reservation.packageName,
    eventStartDate: Timestamp.fromDate(reservation.eventStartDate),
    amountInCentavos: input.amountInCentavos,
    method: 'cash',
    reference: input.reference,
    note: input.note,
    recordedBy,
    recordedByName,
    createdAt: serverTimestamp(),
  });

  batch.set(receiptRef, {
    reservationId: reservation.id,
    customerId: reservation.customerId,
    packageName: reservation.packageName,
    eventStartDate: Timestamp.fromDate(reservation.eventStartDate),
    amountInCentavos: input.amountInCentavos,
    method: 'cash',
    reference: input.reference,
    createdAt: serverTimestamp(),
  });

  await batch.commit();
}

export function getPaymentErrorMessage(error: unknown): string {
  if (error instanceof Error && knownPaymentMessages.has(error.message)) {
    return error.message;
  }

  return 'We could not record that payment. Please try again.';
}

function parsePaymentReservation(
  document: QueryDocumentSnapshot<DocumentData> | { id: string; data: () => DocumentData },
): PaymentReservation | null {
  const value = document.data();
  const status = value.status;
  const event = value.event;
  const packageSnapshot = value.package;

  if (!isPayableReservationStatus(status)) {
    return null;
  }

  if (
    typeof value.customerId !== 'string' ||
    !event ||
    !(event.startDate instanceof Timestamp) ||
    !packageSnapshot ||
    typeof packageSnapshot.packageName !== 'string' ||
    !Number.isSafeInteger(packageSnapshot.priceInCentavos) ||
    packageSnapshot.priceInCentavos < 0
  ) {
    throw new Error('Reservation payment data is invalid.');
  }

  return {
    id: document.id,
    customerId: value.customerId,
    status,
    packageName: packageSnapshot.packageName,
    packageBasePriceInCentavos: packageSnapshot.priceInCentavos,
    eventStartDate: event.startDate.toDate(),
  };
}

function parsePaymentRecord(document: QueryDocumentSnapshot<DocumentData>): PaymentRecord {
  const value = document.data({ serverTimestamps: 'estimate' });

  if (
    typeof value.reservationId !== 'string' ||
    typeof value.customerId !== 'string' ||
    typeof value.packageName !== 'string' ||
    !(value.eventStartDate instanceof Timestamp) ||
    !Number.isSafeInteger(value.amountInCentavos) ||
    value.amountInCentavos <= 0 ||
    !isPaymentMethod(value.method) ||
    typeof value.reference !== 'string' ||
    typeof value.note !== 'string' ||
    typeof value.recordedByName !== 'string' ||
    !(value.createdAt instanceof Timestamp)
  ) {
    throw new Error('Payment data is invalid.');
  }

  return {
    id: document.id,
    reservationId: value.reservationId,
    customerId: value.customerId,
    packageName: value.packageName,
    eventStartDate: value.eventStartDate.toDate(),
    amountInCentavos: value.amountInCentavos,
    method: value.method,
    reference: value.reference,
    note: value.note,
    recordedByName: value.recordedByName,
    createdAt: value.createdAt.toDate(),
  };
}

function parsePaymentReceipt(document: QueryDocumentSnapshot<DocumentData>): PaymentReceipt {
  const value = document.data({ serverTimestamps: 'estimate' });

  if (
    typeof value.reservationId !== 'string' ||
    typeof value.packageName !== 'string' ||
    !(value.eventStartDate instanceof Timestamp) ||
    !Number.isSafeInteger(value.amountInCentavos) ||
    value.amountInCentavos <= 0 ||
    !isPaymentMethod(value.method) ||
    typeof value.reference !== 'string' ||
    !(value.createdAt instanceof Timestamp)
  ) {
    throw new Error('Payment receipt data is invalid.');
  }

  return {
    id: document.id,
    reservationId: value.reservationId,
    packageName: value.packageName,
    eventStartDate: value.eventStartDate.toDate(),
    amountInCentavos: value.amountInCentavos,
    method: value.method,
    reference: value.reference,
    createdAt: value.createdAt.toDate(),
  };
}

function isPayableReservationStatus(value: unknown): value is PayableReservationStatus {
  return value === 'pending_review' || value === 'confirmed' || value === 'completed';
}

function isPaymentMethod(value: unknown): value is PaymentMethod {
  return value === 'cash';
}
