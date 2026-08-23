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

## Planned collections

The following project modules exist in scope but their final schemas are intentionally deferred until their workflows are implemented:

- reservations
- inventory
- inventoryMovements
- payments
- equipment
- equipmentTransactions
- auditLogs

They remain denied by the default Firestore rule until explicit rules are added.
