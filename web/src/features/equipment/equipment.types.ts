export type EquipmentItem = {
  id: string;
  name: string;
  unit: string;
  totalQuantity: number;
  availableQuantity: number;
  inUseQuantity: number;
  damagedQuantity: number;
  missingQuantity: number;
  isActive: boolean;
  lastTransactionId: string | null;
};

export type EquipmentAssignmentStatus =
  | 'assigned'
  | 'released'
  | 'closed'
  | 'cancelled';

export type EquipmentAssignment = {
  id: string;
  reservationId: string;
  customerId: string;
  packageName: string;
  eventStartDate: Date;
  eventEndDate: Date;
  equipmentId: string;
  equipmentName: string;
  unit: string;
  assignedQuantity: number;
  status: EquipmentAssignmentStatus;
  releaseTransactionId: string | null;
  returnTransactionId: string | null;
  returnedGoodQuantity: number;
  damagedQuantity: number;
  missingQuantity: number;
  note: string;
  returnNote: string;
  createdAt: Date;
  updatedAt: Date;
};

export type AssignableReservation = {
  id: string;
  customerId: string;
  packageName: string;
  eventStartDate: Date;
  eventEndDate: Date;
};

export type EquipmentItemInput = {
  name: string;
  unit: string;
  totalQuantity: number;
  isActive: boolean;
};

export type EquipmentItemEditInput = {
  name: string;
  isActive: boolean;
};

export type EquipmentAssignmentInput = {
  reservationId: string;
  equipmentId: string;
  assignedQuantity: number;
  note: string;
};

export type EquipmentReturnInput = {
  returnedGoodQuantity: number;
  damagedQuantity: number;
  missingQuantity: number;
  returnNote: string;
};

export type StaffIdentity = {
  id: string;
  displayName: string;
};
