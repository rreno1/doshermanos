export type PaymentReceipt = {
  id: string;
  reservationId: string;
  packageName: string;
  eventStartDate: Date;
  amountInCentavos: number;
  reference: string;
  createdAt: Date;
};
