import { subscribeToEquipmentTransactions } from '../equipment/equipment.service';
import type { EquipmentTransactionRecord } from '../equipment/equipment.types';
import { subscribeToRecentInventoryMovements } from '../inventory/inventory.service';
import type { InventoryMovement } from '../inventory/inventory.types';
import { subscribeToRecentPayments } from '../payments/payment.service';
import type { PaymentRecord } from '../payments/payment.types';
import type { AuditActivity, AuditActivityKind } from './audit.types';

const maximumAuditActivities = 60;

export function subscribeToAuditActivity(
  onActivities: (activities: AuditActivity[]) => void,
  onError: () => void,
) {
  let inventoryMovements: InventoryMovement[] = [];
  let payments: PaymentRecord[] = [];
  let equipmentTransactions: EquipmentTransactionRecord[] = [];
  let hasFailed = false;

  function publish() {
    const activities = [
      ...inventoryMovements.map(inventoryMovementToAuditActivity),
      ...payments.map(paymentToAuditActivity),
      ...equipmentTransactions.map(equipmentTransactionToAuditActivity),
    ]
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, maximumAuditActivities);

    onActivities(activities);
  }

  function handleError() {
    if (hasFailed) {
      return;
    }

    hasFailed = true;
    onError();
  }

  const unsubscribeInventory = subscribeToRecentInventoryMovements((movements) => {
    inventoryMovements = movements;
    publish();
  }, handleError);

  const unsubscribePayments = subscribeToRecentPayments((records) => {
    payments = records;
    publish();
  }, handleError);

  const unsubscribeEquipment = subscribeToEquipmentTransactions((records) => {
    equipmentTransactions = records;
    publish();
  }, handleError);

  return () => {
    unsubscribeInventory();
    unsubscribePayments();
    unsubscribeEquipment();
  };
}

function inventoryMovementToAuditActivity(movement: InventoryMovement): AuditActivity {
  const labels: Record<InventoryMovement['type'], { kind: AuditActivityKind; title: string }> = {
    stock_in: { kind: 'inventory_stock_in', title: 'Inventory stock added' },
    stock_out: { kind: 'inventory_stock_out', title: 'Inventory stock removed' },
    correction: { kind: 'inventory_correction', title: 'Inventory count corrected' },
  };
  const label = labels[movement.type];
  const signedChange = movement.quantityChange > 0
    ? `+${movement.quantityChange}`
    : String(movement.quantityChange);

  return {
    id: `inventory-${movement.id}`,
    kind: label.kind,
    title: label.title,
    detail: `${movement.itemName}: ${signedChange} ${movement.unit} · ${movement.previousQuantity} → ${movement.newQuantity}`,
    actorName: movement.recordedByName,
    createdAt: movement.createdAt,
  };
}

function paymentToAuditActivity(payment: PaymentRecord): AuditActivity {
  return {
    id: `payment-${payment.id}`,
    kind: 'payment_recorded',
    title: 'Cash payment recorded',
    detail: `${payment.packageName}: ${formatPeso(payment.amountInCentavos)}`,
    actorName: payment.recordedByName,
    createdAt: payment.createdAt,
  };
}

function equipmentTransactionToAuditActivity(
  transaction: EquipmentTransactionRecord,
): AuditActivity {
  if (transaction.type === 'release') {
    return {
      id: `equipment-${transaction.id}`,
      kind: 'equipment_released',
      title: 'Equipment released',
      detail: `${transaction.equipmentName}: ${transaction.quantity} ${transaction.unit}`,
      actorName: transaction.recordedByName,
      createdAt: transaction.createdAt,
    };
  }

  return {
    id: `equipment-${transaction.id}`,
    kind: 'equipment_returned',
    title: 'Equipment returned',
    detail: `${transaction.equipmentName}: ${transaction.returnedGoodQuantity} usable, ${transaction.damagedQuantity} damaged, ${transaction.missingQuantity} missing`,
    actorName: transaction.recordedByName,
    createdAt: transaction.createdAt,
  };
}

function formatPeso(amountInCentavos: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amountInCentavos / 100);
}
