import {
  Timestamp,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from '../../firebase/firebase';
import type { PaymentReceipt } from './payment.types';

const maximumCustomerReceipts = 30;

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

function parsePaymentReceipt(document: QueryDocumentSnapshot<DocumentData>): PaymentReceipt {
  const value = document.data({ serverTimestamps: 'estimate' });

  if (
    typeof value.reservationId !== 'string' ||
    typeof value.packageName !== 'string' ||
    !(value.eventStartDate instanceof Timestamp) ||
    !Number.isSafeInteger(value.amountInCentavos) ||
    value.amountInCentavos <= 0 ||
    value.method !== 'cash' ||
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
    reference: value.reference,
    createdAt: value.createdAt.toDate(),
  };
}
