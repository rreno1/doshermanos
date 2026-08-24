export type ReservationStatus =
  | 'pending_review'
  | 'confirmed'
  | 'rejected'
  | 'cancelled'
  | 'completed';

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

export type ReservationEvent = {
  startDate: Date;
  endDate: Date;
  location: string;
  guestCount: number;
  serviceRequirements: string;
};

export type ReservationRecord = {
  id: string;
  status: ReservationStatus;
  event: ReservationEvent;
  package: {
    packageId: string;
    packageName: string;
    priceInCentavos: number;
  };
  customization: ReservationCustomizationRequest;
  createdAt: Date;
};
