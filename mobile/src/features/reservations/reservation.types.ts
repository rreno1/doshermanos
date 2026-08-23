export type ReservationStatus =
  | 'pending_review'
  | 'confirmed'
  | 'rejected'
  | 'cancelled'
  | 'completed';

export type ReservationRequestInput = {
  startDate: string;
  endDate: string;
  location: string;
  guestCount: number;
  serviceRequirements: string;
};

export type ReservationRecord = {
  id: string;
  status: ReservationStatus;
  event: ReservationRequestInput;
  package: {
    packageId: string;
    packageName: string;
    priceInCentavos: number;
  };
  createdAt: Date;
};
