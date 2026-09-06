export type ReservationStatus =
  | 'pending_review'
  | 'confirmed'
  | 'rejected'
  | 'cancelled'
  | 'completed';

export type ReservationSource = 'customer_portal' | 'manual';

export type ReservationCustomizationRequest = {
  menuRequest: string;
  foodQuantityRequest: string;
  supplyRequest: string;
};

export type ReservationRequestInput = {
  startDate: string;
  endDate: string;
  location: string;
  guestCount: number;
  serviceRequirements: string;
  customization: ReservationCustomizationRequest;
};

export type ManualReservationCustomer = {
  name: string;
  contact: string;
};

export type ReservationEnteredBy = {
  userId: string;
  displayName: string;
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
  source: ReservationSource;
  manualCustomer: ManualReservationCustomer | null;
  enteredBy: ReservationEnteredBy | null;
  event: ReservationEvent;
  package: ReservationPackageSnapshot;
  customization: ReservationCustomizationRequest;
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
