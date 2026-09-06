# Operational Audit Trail

## Current design

Dos Hermanos does not duplicate every operational event into a generic `auditLogs` collection. The current administrator audit view is derived from workflow-specific append-only records that carry the authoritative details of each protected operation:

- `inventoryMovements` for stock-in, stock-out, and physical-count corrections;
- `payments` for manually recorded cash payments;
- `reservationDecisions` for protected reservation review decisions;
- `equipmentTransactions` for physical equipment release and return;
- `userAccessEvents` for administrator role and account-status changes.

The web administrator workspace subscribes to bounded recent records from those collections, normalizes them into one chronological activity feed, and displays the responsible actor and event time. The underlying workflow records remain the source of truth.

This keeps the audit view simple and avoids storing a second copy of amounts, stock quantities, equipment counts, access states, or other business data solely for presentation.

## Integrity properties

The records used by the current audit view have domain-specific Firestore Security Rules:

- customers and unauthenticated users cannot read staff-only operational histories;
- inventory movement records are append-only and must match the linked inventory quantity change;
- payment records are append-only and must match the linked reservation and customer-safe receipt;
- reservation rejection records are immutable and must be created atomically with the protected status transition;
- equipment transactions are append-only and must match the linked equipment and assignment changes;
- user access events are immutable and must be created atomically with the corresponding target-user role/status change;
- recorder/actor identity and server timestamps are validated by Firestore Rules for these records.

The unified audit view therefore does not create a weaker client-written audit copy. It reads the same records that authorize and explain the original operation.

## Current coverage

The administrator audit view currently covers:

- inventory stock-in;
- inventory stock-out;
- inventory physical-count corrections;
- manual cash-payment recording;
- reservation rejection decisions;
- equipment release;
- equipment return and damaged/missing reconciliation;
- administrator role and account-status changes.

Equipment assignment creation and cancellation remain visible in the equipment workspace but do not yet have their own immutable history records. They should gain a dedicated append-only assignment event when that lifecycle is expanded.

## Future audit requirements

The following incomplete or future workflows are not represented in the unified audit view yet:

- reservation approval/confirmation, cancellation, and completion decisions;
- package create/update/deactivate history;
- future hosted-payment provider events;
- future inventory allocation from confirmed reservations;
- future equipment repair, recovery, acquisition, or disposal adjustments.

Each workflow that changes protected business state must introduce an immutable, actor-attributed history record as part of its authoritative write before that workflow is considered production-complete. The unified audit view should consume those history records rather than inventing a parallel generic event log.

## Read scope

The unified audit view is displayed only to active administrators. Staff continue to see the operational history relevant to inventory, payments, and equipment inside their respective modules.

The current view intentionally limits the combined feed to the most recent 60 normalized activities. Each underlying Firestore subscription is also bounded.
