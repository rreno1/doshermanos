# Module Map

## Web

- `auth`: Firebase Authentication account, session, profile, and protected routing support
- `packages`: package catalog and later staff package management
- `reservations`: event scheduling, event details, customization, review, changes, and cancellations
- `inventory`: ingredients, supplies, stock availability, and inventory movements
- `payments`: manual deposits, balances, cash/manual payment recording, and payment status
- `equipment`: release, return, missing, and damaged equipment accountability
- `reports`: reservation, sales, payment, inventory, and equipment reporting

## Mobile

- `auth`: Firebase Authentication customer account and session flow
- `packages`: customer package browsing
- `reservations`: customer reservation request and status workflows
- `payments`: customer-visible payment status and permitted payment information

## Implemented slices

- Firebase project configuration boundary
- Firestore default-deny security model
- Firestore rule test suite in CI
- web package catalog
- mobile package catalog
- Firebase Authentication initialization on web and mobile
- customer registration and sign-in using the configured Email/Password provider
- account recovery and sign-out
- application profile creation and role/status resolution
- reservation request Firestore schema
- customer ownership rules for reservation requests
- authoritative active-package snapshot checks at reservation creation
- protection against client-side self-confirmation
- support for multiple reservation requests on the same event date

## Current deferred work

- the Email/Password provider can remain disabled in Firebase Console until the project is ready; the code is already wired
- final reservation confirmation remains pending because Dos Hermanos allows multiple simultaneous events and the exact operational capacity rule is not yet defined
- inventory, payment, equipment, and reporting workflows are not yet implemented

See `authentication.md` and `scheduling-policy.md` for the current boundaries.
