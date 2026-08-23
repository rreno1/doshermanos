# Firestore Schema

This document records only data shapes that are currently implemented or required by the active implementation slice. Additional collections are added when their access patterns and security rules are defined.

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

Purpose: public-facing catering package catalog. Do not place staff-only notes, internal costing, or other private fields in this document because active package documents are readable by the public catalog.

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

Security:

- active packages may be read by the public catalog;
- active staff and administrators may read all package documents;
- active staff and administrators may create or update package documents;
- only active administrators may delete package documents.

## `reservations/{reservationId}`

Purpose: customer-visible reservation request record. The document contains only information that the owning customer and authorized staff may read. Staff-only notes must not be added to this document.

Fields:

- `customerId`: Firebase Authentication UID of the owning customer
- `status`: `pending_review | confirmed | rejected | cancelled | completed`
- `event.startDate`: date-only string in `YYYY-MM-DD` form
- `event.endDate`: date-only string in `YYYY-MM-DD` form
- `event.location`: event location, 1-300 characters
- `event.guestCount`: positive integer, currently bounded at 10,000
- `package.packageId`: selected package document ID
- `package.packageName`: immutable request-time package name snapshot
- `package.priceInCentavos`: immutable request-time base package price snapshot
- `createdAt`: Firestore server timestamp
- `updatedAt`: Firestore server timestamp

Creation rules:

- only an active authenticated customer may create a request;
- the `customerId` must match the authenticated user;
- the initial status must be `pending_review`;
- the selected package must exist and be active;
- the submitted package name and base price must match the authoritative package document;
- the customer cannot submit a reservation as already confirmed.

Read rules:

- customers may read only reservation records whose `customerId` matches their own UID;
- staff and administrators may read reservation records for operational review;
- unauthenticated access is denied.

Update rules in the current slice:

- customers cannot directly modify submitted reservation records;
- staff and administrators may reject a `pending_review` request;
- normal client operations cannot transition a request to `confirmed` yet;
- deletion is denied.

The restriction on confirmation is deliberate. Dos Hermanos has confirmed that multiple events may occur simultaneously, so a global one-event-per-date lock would be wrong. The actual capacity rule for final confirmation is still undefined. See `docs/scheduling-policy.md`.

### Package snapshot reason

The request stores the selected package name and base price so later package edits do not silently rewrite the meaning of an older request. Firestore Security Rules compare these fields with the active package document at request creation so a customer cannot forge a different name or base price.

This is only the base package snapshot. Final package customization and authoritative total-price logic remain deferred until the actual pricing and customization rules are approved.

### Date semantics

`startDate` and `endDate` are date-only business values, not timestamps. They use the sortable `YYYY-MM-DD` representation to avoid ambiguous locale formatting. Application validation must ensure the end date is not earlier than the start date before submission.

## Planned collections

The following project modules remain in scope but their final schemas are intentionally deferred until their workflows are implemented:

- inventory
- inventoryMovements
- payments
- equipment
- equipmentTransactions
- auditLogs

They remain denied by the default Firestore rule until explicit rules are added.
