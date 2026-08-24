export type AuditActivityKind =
  | 'inventory_stock_in'
  | 'inventory_stock_out'
  | 'inventory_correction'
  | 'payment_recorded'
  | 'reservation_rejected'
  | 'equipment_released'
  | 'equipment_returned';

export type AuditActivity = {
  id: string;
  kind: AuditActivityKind;
  title: string;
  detail: string;
  actorName: string;
  createdAt: Date;
};
