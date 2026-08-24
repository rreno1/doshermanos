# Firestore Schema

This document records data shapes that are implemented or required by the active implementation slices. New collections are added only after their access patterns and security rules are defined.

## `users/{uid}`

Purpose: application profile and authorization metadata associated with a Firebase Authentication identity.

Fields:

- `displayName`: string, 1-100 characters
- `role`: `customer | staff | admin`
- `status`: `active | inactive | suspended`
- `createdAt`: Firestore timestamp
- `updatedAt`: Firestore timestamp

Security:

- a signed-in user may read only their own profile unless they are an administrator;
- a new user may create only their own profile and only as an active customer;
- a user may update only their own `displayName` and `updatedAt`;
- only an active administrator may change protected role or status fields;
- profile deletion is denied to clients.

## `packages/{packageId}`

Purpose: public-facing catering package catalog. Staff-only notes, internal costing, and private fields do not belong in this document because active package documents are public-readable.

Fields:

- `name`: string, 1-120 characters
- `description`: string, up to 2,000 characters
- `priceInCentavos`: non-negative integer
- `menuHighlights`: bounded list with at most 20 entries
- `isActive`: boolean
- `sortOrder`: integer from 0-10,000
- `createdAt`: Firestore timestamp
- `updatedAt`: Firestore timestamp

Read pattern:

```text
packages
where isActive == true
order by sortOrder ascending
limit 24
```

## `reservations/{reservationId}`

Purpose: customer reservation requests and their protected review status.

Fields:

- `customerId`: Firebase Authentication UID of the customer
- `status`: `pending_review | confirmed | rejected | cancelled | completed`
- `event.startDate`: Firestore timestamp representing the selected business date at 00:00 UTC
- `event.endDate`: Firestore timestamp representing the selected business date at 00:00 UTC
- `event.location`: string, 1-300 characters
- `event.guestCount`: integer, 1-10,000
- `event.serviceRequirements`: string, up to 1,000 characters; may be empty
- `package.packageId`: selected package document ID
- `package.packageName`: immutable request-time package-name snapshot
- `package.priceInCentavos`: immutable request-time base-price snapshot
- `createdAt`: Firestore server timestamp
- `updatedAt`: Firestore server timestamp

Customer creation rules:

- the caller must be an active customer;
- `customerId` must equal the authenticated UID;
- the initial status must be `pending_review`;
- `event.startDate` and `event.endDate` must be timestamps and the end date cannot be earlier than the start date;
- package name and base price must match the referenced active package;
- customers cannot directly edit or delete a submitted request.

The application validates that the selected start date is not in the past before submission. Firestore independently enforces the persisted date type and chronological ordering so a client cannot submit an invalid date string or reverse the event range.

Customer read pattern:

```text
reservations
where customerId == currentUser.uid
order by createdAt descending
limit 20
```

The query has a matching compound index. Customer ownership is enforced again by Firestore Security Rules; frontend filtering is not the security boundary.

### Package snapshot reason

A reservation keeps the package name and base price that were presented when the request was created. Later package edits therefore do not silently rewrite the historical request.

### Current confirmation boundary

Dos Hermanos can handle multiple simultaneous events. A global one-event-per-date lock is therefore incorrect. Final confirmation remains blocked from normal client writes until the actual operational capacity rule is approved and can be enforced safely.

## `inventory/{inventoryItemId}`

Purpose: current staff-managed stock level for one ingredient or supply.

Fields:

- `name`: string, 1-120 characters
- `unit`: string, 1-40 characters
- `quantity`: whole-number integer, 0-100,000,000
- `lowStockThreshold`: whole-number integer, 0-100,000,000
- `isActive`: boolean
- `lastMovementId`: latest linked movement document ID or `null` before the first stock change
- `createdAt`: Firestore server timestamp
- `updatedAt`: Firestore server timestamp

Inventory quantities intentionally use whole numbers. Staff should choose the smallest practical counting unit, such as grams instead of kilograms or milliliters instead of liters, when fractional amounts need to be tracked. This avoids floating-point stock calculations while keeping the model simple.

New items always start at quantity `0`. Opening stock must be added through a movement so every quantity increase or decrease has a history record.

Low stock is derived at read time:

```text
isActive && quantity <= lowStockThreshold
```

No duplicate `isLowStock` field is stored.

Read pattern:

```text
inventory
order by name ascending
limit 100
```

Only active staff and administrators can read inventory records.

## `inventoryMovements/{movementId}`

Purpose: append-only history for every inventory quantity change.

Fields:

- `inventoryItemId`: linked inventory document ID
- `itemName`: movement-time item-name snapshot
- `unit`: movement-time tracking-unit snapshot
- `type`: `stock_in | stock_out | correction`
- `quantityChange`: signed non-zero integer
- `previousQuantity`: quantity before the change
- `newQuantity`: quantity after the change
- `note`: optional string up to 300 characters; required for corrections
- `recordedBy`: authenticated staff/admin UID
- `recordedByName`: staff/admin display-name snapshot verified against the current user profile
- `createdAt`: Firestore server timestamp

Stock movement and inventory quantity update must be committed together. Firestore Security Rules use `get()` and `getAfter()` to verify that:

- the movement references the inventory document being changed;
- `previousQuantity` matches the stored quantity before the write;
- `newQuantity` matches the inventory quantity after the write;
- `quantityChange` exactly bridges the two values;
- `lastMovementId` points to the newly created movement;
- the recorder UID and display name match the authenticated active staff/admin account;
- stock cannot become negative;
- a movement cannot be edited or deleted afterward.

Recent activity read pattern:

```text
inventoryMovements
order by createdAt descending
limit 30
```

This first inventory slice supports deliberate staff stock-in, stock-out, and physical-count corrections. Automatic reservation-based deductions remain out of scope until the reservation confirmation/capacity rule is finalized.

## `payments/{paymentId}`

Purpose: private append-only financial record created when active staff or an administrator records money received manually.

Fields:

- `reservationId`: linked reservation document ID
- `customerId`: customer UID copied from the reservation
- `packageName`: reservation package-name snapshot
- `eventStartDate`: reservation event start-date snapshot
- `amountInCentavos`: positive integer, 1-100,000,000
- `method`: currently only `cash`
- `reference`: optional customer-safe receipt/reference text, up to 120 characters
- `note`: optional internal staff note, up to 300 characters
- `recordedBy`: authenticated staff/admin UID
- `recordedByName`: staff/admin display-name snapshot verified against the current profile
- `createdAt`: Firestore server timestamp

Security and integrity:

- customers and unauthenticated users cannot read this collection;
- only active staff/admin can create a payment;
- the recorder UID and display name must match the authenticated profile;
- the linked reservation must exist and its customer, package name, and event start date must match the payment snapshots;
- rejected and cancelled reservations cannot receive a new payment through this workflow;
- a matching `paymentReceipts/{paymentId}` document must be created in the same atomic write;
- payment records cannot be updated or deleted by clients.

The system does not currently calculate final balance, deposit status, refund state, or overpayment handling from this collection because the underlying business rules and final pricing authority are not yet approved.

Recent staff read pattern:

```text
payments
order by createdAt descending
limit 50
```

## `paymentReceipts/{paymentId}`

Purpose: customer-safe projection of a recorded manual payment. This collection exists because Firestore returns whole documents and cannot hide the internal `note`, `recordedBy`, or `recordedByName` fields from a customer who can read a document.

Fields:

- `reservationId`: linked reservation document ID
- `customerId`: owner UID
- `packageName`: reservation package-name snapshot
- `eventStartDate`: reservation event start-date snapshot
- `amountInCentavos`: positive integer
- `method`: currently only `cash`
- `reference`: optional receipt/reference text
- `createdAt`: Firestore server timestamp

Rules require the receipt and private payment to use the same document ID and matching reservation, customer, package, event date, amount, method, reference, and server timestamp. Neither document can be created alone.

Customer read pattern:

```text
paymentReceipts
where customerId == currentUser.uid
order by createdAt descending
limit 30
```

The query has a compound index and Firestore independently enforces receipt ownership.

### Hosted payment-link readiness boundary

The web and mobile interfaces include a disabled hosted payment-link card to reserve the future customer experience. It is UI readiness only. There is no provider SDK, checkout URL, card field, CVC field, expiry field, webhook, payment-status callback, provider secret, or live payment-processing path in the current codebase.

A future hosted-payment implementation must be reviewed as a separate architecture and security change before this data model is extended for provider payment IDs, verified statuses, idempotency, callbacks, or webhooks.

## `equipment/{equipmentId}`

Purpose: current physical accountability state for one reusable equipment type.

Fields:

- `name`: string, 1-120 characters
- `unit`: immutable counting unit, 1-40 characters
- `totalQuantity`: immutable registered total, positive integer up to 1,000,000
- `availableQuantity`: units physically available for release
- `inUseQuantity`: units currently released to events
- `damagedQuantity`: units returned damaged and not counted as available
- `missingQuantity`: units not returned and not counted as available
- `isActive`: whether new assignments/releases are allowed
- `lastTransactionId`: latest linked release/return transaction ID, or `null` before the first physical movement
- `createdAt`: Firestore server timestamp
- `updatedAt`: Firestore server timestamp

The invariant is:

```text
totalQuantity = availableQuantity + inUseQuantity + damagedQuantity + missingQuantity
```

New equipment begins fully available. This first slice keeps the registered total and counting unit immutable after creation. Later acquisition, disposal, repair, recovery, or quantity-correction workflows require an explicit equipment-adjustment design rather than silently rewriting physical accountability counts.

Read pattern:

```text
equipment
order by name ascending
limit 100
```

Only active staff and administrators can read equipment records. Customers and unauthenticated users cannot access equipment state.

## `equipmentAssignments/{assignmentId}`

Purpose: current accountability lifecycle for equipment planned and physically released to a reservation.

Fields:

- `reservationId`: linked reservation ID
- `customerId`: reservation customer snapshot
- `packageName`: reservation package-name snapshot
- `eventStartDate`: reservation event start date
- `eventEndDate`: reservation event end date
- `equipmentId`: linked equipment ID
- `equipmentName`: assignment-time equipment-name snapshot
- `unit`: assignment-time unit snapshot
- `assignedQuantity`: whole-number planned/released quantity
- `status`: `assigned | released | closed | cancelled`
- `releaseTransactionId`: linked release transaction or `null`
- `returnTransactionId`: linked return transaction or `null`
- `returnedGoodQuantity`: usable units returned when closed
- `damagedQuantity`: damaged units reported when closed
- `missingQuantity`: missing units reported when closed
- `note`: optional assignment note, up to 500 characters
- `returnNote`: optional return note, but required when damaged or missing quantity is non-zero
- `createdBy`: staff/admin UID that created the assignment
- `createdByName`: verified display-name snapshot
- `createdAt`: Firestore server timestamp
- `updatedAt`: Firestore server timestamp

Assignment creation is allowed only for an active equipment item and a reservation whose current status is `pending_review` or `confirmed`. Reservation customer, package, and event dates must match the authoritative reservation document. The assigned quantity cannot exceed the registered equipment total.

An assignment does not reserve future physical availability. This is intentional because Dos Hermanos can run simultaneous events and the final overlapping-event capacity rule is not defined. Physical availability is enforced at release time instead.

Recent assignment read pattern:

```text
equipmentAssignments
order by updatedAt descending
limit 60
```

## `equipmentTransactions/{transactionId}`

Purpose: immutable history of physical equipment release and return.

Fields:

- `equipmentId`, `equipmentName`, `unit`: linked equipment identity and assignment-time snapshots
- `assignmentId`: linked equipment assignment
- `reservationId`: linked reservation
- `type`: `release | return`
- `quantity`: whole-number released/returned accountability quantity
- `returnedGoodQuantity`: zero on release; usable return count on return
- `damagedQuantity`: zero on release; damaged return count on return
- `missingQuantity`: zero on release; missing return count on return
- `note`: empty on release; return explanation when supplied
- `recordedBy`: authenticated staff/admin UID
- `recordedByName`: verified display-name snapshot
- `createdAt`: Firestore server timestamp

A physical release is one atomic write containing:

1. equipment counts moving from `availableQuantity` to `inUseQuantity`;
2. assignment transition from `assigned` to `released`;
3. the immutable `release` transaction.

A physical return is one atomic write containing:

1. usable units moving from `inUseQuantity` back to `availableQuantity`;
2. damaged/missing units moving from `inUseQuantity` into their accountability counts;
3. assignment transition from `released` to `closed` with every released unit accounted for;
4. the immutable `return` transaction.

Firestore Rules cross-check all linked documents with `get()` and `getAfter()`. Direct equipment count edits, forged recorder identity, standalone history records, partial release/return writes, negative physical counts, and incomplete return accounting are denied.

## Planned collections

- auditLogs

The remaining collection stays denied by the default Firestore rule until its explicit access model is implemented.
