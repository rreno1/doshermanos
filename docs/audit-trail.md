# Operational Audit Trail

## Current design

Dos Hermanos does not duplicate every operational event into a generic `auditLogs` collection. The current administrator audit view is derived from the append-only domain records that already carry the authoritative details of each operation:

- `inventoryMovements` for stock-in, stock-out, and physical-count corrections;
- `payments` for manually recorded cash payments;
- `equipmentTransactions` for physical equipment release and return.

The web administrator workspace subscribes to bounded recent records from those collections, normalizes them into one chronological activity feed, and displays the responsible staff name and event time. The underlying domain records remain the source of truth.

This keeps the audit view simple and avoids storing a second copy of amounts, stock quantities, equipment counts, notes, or other business data solely for presentation.

## Integrity properties

The records used by the current audit view already have domain-specific Firestore Security Rules:

- customers and unauthenticated users cannot read staff-only operational histories;
- inventory movement records are append-only and must match the linked inventory quantity change;
- payment records are append-only and must match the linked reservation and customer-safe receipt;
- equipment transactions are append-only and must match the linked equipment and assignment changes;
- recorder identity and server timestamps are validated by Firestore Rules for these records.

The unified audit view therefore does not create a weaker client-written audit copy. It reads the same records that authorize and explain the original operation.

## Current coverage

The administrator audit view currently covers:

- inventory stock-in;
- inventory stock-out;
- inventory physical-count corrections;
- manual cash-payment recording;
- equipment release;
- equipment return and damaged/missing reconciliation.

Equipment assignment creation and cancellation remain visible in the equipment workspace but do not yet have their own immutable history records. They should gain a dedicated append-only assignment event when that lifecycle is expanded.

## Future audit requirements

The following workflows are not yet implemented as complete management features and therefore are not represented in the unified audit view yet:

- reservation approval, rejection, cancellation, and completion decisions;
- package create/update/deactivate/delete management;
- administrator role and account-status changes;
- future hosted-payment provider events;
- future inventory allocation from confirmed reservations;
- future equipment repair, recovery, acquisition, or disposal adjustments.

Each of those workflows must introduce an immutable, actor-attributed history record as part of its authoritative write before it is considered production-complete. The unified audit view should consume those history records rather than inventing a parallel generic event log.

## Read scope

The unified audit view is currently displayed only to active administrators. Staff continue to see the operational history relevant to inventory, payments, and equipment inside their respective modules.

The current view intentionally limits the combined feed to the most recent 60 normalized activities. Each underlying Firestore subscription is also bounded.
