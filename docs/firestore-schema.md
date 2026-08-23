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
- `event.startDate`: date-only string in `YYYY-MM-DD`
- `event.endDate`: date-only string in `YYYY-MM-DD`
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
- package name and base price must match the referenced active package;
- customers cannot directly edit or delete a submitted request.

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

## Planned collections

- inventory
- inventoryMovements
- payments
- equipment
- equipmentTransactions
- auditLogs

These remain denied by the default Firestore rule until explicit access models are implemented.
