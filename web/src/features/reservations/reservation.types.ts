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
  status: ReservationStatus;
  event: ReservationEvent;
  package: ReservationPackageSnapshot;
  createdAt: Date;
};
