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

export type ReservationEvent = {
  startDate: Date;
  endDate: Date;
  location: string;
  guestCount: number;
  serviceRequirements: string;
};

export type ReservationPackageSnapshot = {
  packageId: string;
  packageName: string;
  priceInCentavos: number;
};

export type ReservationRecord = {
  id: string;
  customerId: string;
  status: ReservationStatus;
  event: ReservationEvent;
  package: ReservationPackageSnapshot;
  createdAt: Date;
  updatedAt: Date;
};

export type ReservationDecision = {
  id: string;
  reservationId: string;
  customerId: string;
  previousStatus: 'pending_review';
  newStatus: 'rejected';
  decidedBy: string;
  decidedByName: string;
  createdAt: Date;
};
