# Module Map

## Web

- `auth`: identity, session, profile, and protected routing
- `packages`: package catalog and later staff package management
- `reservations`: event scheduling, event details, customization, review, changes, and cancellations
- `inventory`: ingredients, supplies, stock availability, and inventory movements
- `payments`: manual deposits, balances, cash/manual payment recording, and payment status
- `equipment`: release, return, missing, and damaged equipment accountability
- `reports`: reservation, sales, payment, inventory, and equipment reporting

## Mobile

- `auth`: customer identity and session
- `packages`: customer package browsing
- `reservations`: customer reservation request and status workflows
- `payments`: customer-visible payment status and permitted payment information

## Current implementation slice

Implemented:

- Firebase project configuration boundary
- Firestore default-deny security model
- Firestore rule test suite in CI
- web package catalog
- mobile package catalog
- reservation request Firestore schema
- customer ownership rules for reservation requests
- authoritative active-package snapshot checks at reservation creation
- protection against client-side self-confirmation
- support for multiple reservation requests on the same event date

Authentication provider selection is intentionally still pending. Until authentication is configured, the reservation request UI is not exposed as a production submission path.

Final reservation confirmation is also intentionally pending because Dos Hermanos allows multiple simultaneous events and the exact operational capacity rule has not yet been defined. See `scheduling-policy.md`.
