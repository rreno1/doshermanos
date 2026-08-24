# Module Map

## Web

- `auth`: email/password identity, session, profile, and account-state handling
- `packages`: public package catalog and later staff package management
- `reservations`: customer request form, event details, service requirements, own-request tracking, later review/customization/confirmation workflows
- `inventory`: staff/admin ingredients and supplies, stock levels, low-stock thresholds, and append-only inventory movements
- `payments`: staff/admin cash payment recording, private payment history, customer-safe receipts, and a disabled hosted payment-link readiness card
- `equipment`: staff/admin equipment registry, event assignment, physical release, return, damaged/missing accountability, and immutable transaction history
- `reports`: reservation, sales, payment, inventory, and equipment reporting

## Mobile

- `auth`: customer email/password identity and session
- `packages`: customer package browsing
- `reservations`: customer request submission and own-request tracking
- `payments`: customer-owned safe payment receipts plus a disabled hosted payment-link readiness card

## Implemented slices

- Firebase project configuration boundary
- Firestore default-deny security model
- Firestore rule tests in CI
- Email/Password authentication on web and mobile
- public active-package catalog on web and mobile
- reservation request Firestore schema and ownership rules
- authoritative active-package snapshot checks at reservation creation
- customer reservation request UI on web and mobile
- customer-owned request tracking with bounded queries
- native Expo date selection for the mobile reservation form
- protection against client-side self-confirmation
- support for multiple reservation requests on the same event date
- staff/admin web inventory workspace
- bounded inventory list and recent stock-activity subscriptions
- low-stock state derived from quantity and threshold
- atomic stock-in, stock-out, and physical-count correction transactions
- append-only inventory movement history linked to every quantity change
- Firestore rules preventing direct quantity edits, forged movement values, negative stock, and customer inventory access
- staff/admin cash payment recording against eligible reservations
- append-only private payment records paired atomically with customer-safe receipt records
- customer payment receipt history on web and mobile with ownership enforced by Firestore
- payment-link readiness card on web and mobile with no live provider, checkout URL, card fields, webhook, or processing path
- staff/admin equipment registry with available, in-use, damaged, and missing counts
- event equipment assignment against pending-review or confirmed reservations
- atomic physical equipment release that moves units from available to in-use
- atomic equipment return that accounts for usable, damaged, and missing units
- immutable equipment transaction history linked to every physical release and return
- Firestore rules preventing customer equipment access, direct equipment count edits, forged release/return records, and incomplete return accountability

Final reservation confirmation remains pending because Dos Hermanos allows multiple simultaneous events and the exact operational capacity rule has not yet been defined. Automatic inventory deductions tied to confirmed reservations therefore remain pending as well. See `scheduling-policy.md`.

Equipment assignment is currently an accountability/preparation workflow, not a future-date capacity lock. An assignment may be planned against an eligible reservation, but actual physical release succeeds only when enough equipment is available at that moment. This avoids inventing an overlapping-event equipment scheduling rule before the reservation capacity model is finalized.

Final payment balance and deposit-status calculations also remain pending because the approved final reservation pricing source, deposit amount or percentage, partial-payment policy, overpayment policy, deadlines, refunds, and correction rules have not yet been locked. Manual cash receipts are implemented without inventing those rules.
