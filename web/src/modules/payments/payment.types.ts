export type PaymentMethod = 'cash';

export type PayableReservationStatus = 'pending_review' | 'confirmed' | 'completed';

export type PaymentReservation = {
  id: string;
  customerId: string;
  status: PayableReservationStatus;
  packageName: string;
  packageBasePriceInCentavos: number;
  eventStartDate: Date;
};

export type PaymentRecord = {
  id: string;
  reservationId: string;
  customerId: string;
  packageName: string;
  eventStartDate: Date;
  amountInCentavos: number;
  method: PaymentMethod;
  reference: string;
  note: string;
  recordedByName: string;
  createdAt: Date;
};

export type PaymentReceipt = {
  id: string;
  reservationId: string;
  packageName: string;
  eventStartDate: Date;
  amountInCentavos: number;
  method: PaymentMethod;
  reference: string;
  createdAt: Date;
};

export type CashPaymentInput = {
  amountInCentavos: number;
  reference: string;
  note: string;
};
