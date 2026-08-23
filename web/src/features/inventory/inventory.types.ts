export type InventoryItem = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  lastMovementId: string | null;
};

export type InventoryMovementType = 'stock_in' | 'stock_out' | 'correction';

export type InventoryMovement = {
  id: string;
  inventoryItemId: string;
  itemName: string;
  unit: string;
  type: InventoryMovementType;
  quantityChange: number;
  previousQuantity: number;
  newQuantity: number;
  note: string;
  recordedByName: string;
  createdAt: Date;
};

export type NewInventoryItemInput = {
  name: string;
  unit: string;
  lowStockThreshold: number;
};

export type InventoryMovementInput = {
  type: InventoryMovementType;
  quantity: number;
  note: string;
};
