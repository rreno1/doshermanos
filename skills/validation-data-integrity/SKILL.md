# Validation and Data Integrity

## Purpose

Keep reservations, inventory, payments, equipment, and user records internally consistent even when clients send invalid or stale input.

## Use this skill when

Writing forms, Firestore writes, calculations, status changes, or transaction logic.

## Hard rules

1. Validate user input before submitting it, but do not treat client validation as the security boundary.
2. Firestore Security Rules must independently reject unauthorized or structurally invalid protected writes where rules can express the constraint.
3. Use explicit allowed status values.
4. Define allowed state transitions instead of permitting arbitrary status replacement.
5. Do not trust client-provided ownership, role, audit, or privileged control fields.
6. Monetary values and quantities must use one consistent representation within each domain.
7. Reject negative quantities where the business process does not allow them.
8. Do not silently correct contradictory data; surface a clear validation error.
9. Use transactions when a write depends on a value that must still be current at commit time.
10. Keep historical transaction records separate from editable current-state summaries where appropriate.
11. Avoid duplicated calculations in multiple features.
12. If a total is derived from authoritative fields, document which value is authoritative.
13. Handle duplicate submission risk for actions that could otherwise create repeated financial or inventory records.
14. Preserve enough context in historical records to explain what happened later.

## State-change rule

High-impact transitions such as reservation confirmation, inventory deductions, payment recording, and equipment reconciliation must be explicit operations rather than generic document edits scattered across the UI.
