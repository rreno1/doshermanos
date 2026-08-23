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

Implemented first:

- Firebase project configuration boundary
- Firestore rules and package index
- web package catalog
- mobile package catalog

Authentication provider selection and protected feature workflows are intentionally deferred until the provider is explicitly approved.
