# Staging Smoke Checklist

Use this checklist after the staging Firebase project is provisioned and before treating staging as a valid release candidate.

## Repository and target safety

- [ ] `node scripts/check-staging-readiness.mjs` passes.
- [ ] `.firebaserc` has a `staging` alias that is different from `production`.
- [ ] `web/.env.staging` points to the same project as the `staging` alias.
- [ ] GitHub Pages is disabled for this repository so Firebase Hosting is the only web deployment surface.
- [ ] Protect `main` and require the CI checks used by this repository before production promotion.
- [ ] The latest CI run is green before deployment.

## Deployment

- [ ] Run `npm ci` and `npm run build:staging` in `web`.
- [ ] Deploy Firestore rules/indexes with `firebase deploy --only firestore --project staging`.
- [ ] Deploy Hosting with `firebase deploy --only hosting --project staging`.
- [ ] Open the Firebase Hosting staging URL in a private/incognito browser session.
- [ ] Confirm browser developer tools show no CSP, mixed-content, or Firebase project-configuration errors.

## Signed-out and customer flow

- [ ] Package catalog loads without signing in.
- [ ] Registration, sign-in, sign-out, and password reset behave correctly.
- [ ] Customer can submit a valid single-day reservation request.
- [ ] Customer can submit a valid multi-day reservation request.
- [ ] Invalid/past dates, invalid guest counts, and over-limit text are rejected by the form.
- [ ] Submitted customization text is visible in the customer's reservation history.
- [ ] A customer cannot view another customer's reservations or payment receipts.
- [ ] Hosted payment-link UI remains disabled and does not imply that online payment is active.

## Staff flow

- [ ] Staff dashboard loads without unauthorized-data errors.
- [ ] Dashboard copy clearly identifies bounded summaries rather than all-time totals.
- [ ] Pending reservation review loads and rejection creates the expected immutable decision history.
- [ ] Reservation confirmation remains unavailable until the approved simultaneous-event capacity and customization rules exist.
- [ ] Inventory item creation/editing and stock-in/stock-out/correction workflows behave correctly.
- [ ] Low-stock warnings appear at or below the configured threshold.
- [ ] Cash payment recording creates both staff payment history and the customer-safe receipt.
- [ ] Retrying the same cash-payment operation does not create a duplicate payment.
- [ ] Equipment creation, assignment, release, return, damaged count, and missing count reconcile correctly.
- [ ] Equipment cannot be physically released when registered availability is insufficient.
- [ ] Reservation, sales-activity, payment, inventory, and equipment reports load.
- [ ] CSV exports open correctly in spreadsheet software and user-controlled values do not execute as formulas.
- [ ] Printed reports contain only the report area and remain readable.

## Administrator flow

- [ ] Administrator can access the audit trail.
- [ ] Staff and customers cannot access administrator-only audit information.
- [ ] Audit records for implemented privileged operational histories cannot be edited or deleted by normal clients.

## UI and accessibility

Test at approximately 360 px, 768 px, and 1440 px viewport widths.

- [ ] No horizontal page overflow appears outside intentionally scrollable report tables.
- [ ] Header, hero, package cards, forms, dashboard metrics, staff navigation, operational panels, and reports remain readable.
- [ ] Keyboard Tab order follows the visual/document order.
- [ ] The `Skip to main content` link appears on keyboard focus and moves past repeated navigation.
- [ ] Interactive controls have a visible keyboard focus state.
- [ ] Account and reservation dialogs can be dismissed with Escape and their close controls.
- [ ] Loading, empty, error, disabled, and success states remain understandable without relying only on color.
- [ ] Reduced-motion preference does not leave essential content hidden.

## Release decision

Do not promote staging to production when any security, authorization, data-integrity, build, or core-flow check above fails. Business-rule-gated features may remain deliberately disabled only when the UI states that limitation accurately and no client can bypass the gate.
