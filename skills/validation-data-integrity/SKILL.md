# Validation and Data Integrity

## Purpose

Keep reservations, inventory, payments, equipment, and user records internally consistent even when clients send invalid, stale, duplicated, manipulated, or contradictory input.

## Use this skill when

Writing forms, Firestore writes, calculations, status changes, transactions, correction flows, or business-rule checks.

## Validation layers

1. UI validation improves user experience.
2. Feature validation keeps application behavior explicit.
3. Firestore Security Rules independently enforce authorization and the structural constraints they can safely express.

Client validation alone is never a security control.

## Hard rules

1. Validate required user input before submission.
2. Do not trust client-provided ownership, role, audit, approval, privileged status, or system-control fields.
3. Use explicit allowed status values.
4. Define allowed state transitions instead of permitting arbitrary status replacement.
5. Reject contradictory data rather than silently correcting it.
6. Reject negative quantities where the business process does not permit them.
7. Use one consistent representation for monetary values across the payment domain.
8. Do not use binary floating-point arithmetic as the authoritative representation for stored money calculations.
9. Define the authoritative amount fields before implementation and format them for display separately.
10. Do not trust a client-provided total when the total can be derived from authoritative stored values and approved selections.
11. Use Firestore transactions when correctness depends on a value remaining current between read and write.
12. Do not use transactions merely because an operation touches Firestore.
13. Keep historical transaction records separate from editable current-state summaries where historical accuracy matters.
14. Avoid duplicated business calculations across web and mobile features.
15. If a value is duplicated, document which copy is authoritative and which copies are snapshots or summaries.
16. Handle duplicate-submit risk for payment, inventory, reservation-confirmation, and equipment operations when repeated writes would create incorrect records.
17. Disable or guard repeated UI submission while a write is pending, but do not treat button disabling as complete duplicate protection.
18. Preserve enough context in historical records to explain what happened later.
19. Never allow a general-purpose edit form to mutate fields that require a specific high-impact transition.
20. Do not allow generic document update utilities to bypass feature validation.
21. Use consistent date/time semantics and reject ambiguous representations.
22. Do not trust client clocks for ordering or audit-critical timestamps when Firestore server timestamps can represent the event instant.
23. Validate identifiers and references before using them in privileged workflows where the rule model permits verification.
24. Failed writes must leave the UI in a recoverable state without pretending the change succeeded.

## High-impact operations

Treat the following as named operations with explicit validation rather than arbitrary document edits:

- confirm reservation;
- reject or cancel reservation;
- record payment;
- correct or reverse payment when correction rules are defined;
- reserve or deduct inventory;
- record inventory movement;
- release equipment;
- reconcile returned, missing, or damaged equipment;
- change user role or status.

## Money rule

Choose and document one authoritative numeric storage representation before payment code is generated. A preferred safe approach is integer minor units (for example centavos) so arithmetic does not depend on floating-point rounding. Do not mix formatted currency strings with authoritative numeric amounts.

## State-transition rule

For each status-controlled entity document:

- initial states;
- allowed next states;
- roles allowed to perform each transition;
- fields allowed to change during the transition;
- side effects that must happen atomically;
- whether reversal/correction is allowed.

Do not implement the UI first and invent transitions afterward.

## Inventory rule

Inventory movement history should explain why stock changed. Do not silently overwrite quantity without an associated business operation when traceability is required.

## Equipment rule

Equipment reconciliation must not permit impossible totals. Released, returned, missing, and damaged quantities must follow the finalized business invariant and be validated consistently.

## Review requirement

For every high-impact write, a reviewer must be able to identify the authoritative inputs, allowed actor, allowed transition, duplicate behavior, failure behavior, and historical record produced by the operation.
