# Firestore Security

## Purpose

Make Firestore Security Rules the authoritative authorization boundary for every client-accessible document and write operation.

## Use this skill when

Creating collections, document paths, queries, roles, ownership rules, status transitions, protected writes, or rule tests.

## Security model

- Firebase Authentication establishes identity.
- Firestore Security Rules determine whether that identity may access a specific document or perform a specific write.
- Frontend role checks only improve UX.
- Default deny is mandatory.

## Hard rules

1. Start from default deny. No collection is readable or writable unless explicitly allowed.
2. Every collection must document why it exists, who may read it, who may create it, who may update it, and who may delete it.
3. Authentication alone is never sufficient for staff or administrator access.
4. Customer-owned records must verify ownership using trusted stored data, not only request-provided ownership fields.
5. Prevent clients from assigning or changing their own privileged role.
6. Prevent clients from changing protected ownership fields after creation.
7. Prevent unauthorized changes to role, status, approval, confirmation, pricing, audit, inventory-control, payment-control, and system-managed fields.
8. Use explicit allowed-field checks for sensitive writes where practical. Reject unexpected fields instead of silently accepting schema expansion.
9. Validate field types, required fields, and basic invariant constraints in rules where Firestore Rules can express them clearly.
10. Do not weaken rules to support a broad frontend query. Redesign the query or data shape instead.
11. Data with different visibility must be stored in different documents or collections. Firestore Rules cannot hide selected fields from a readable document.
12. Historical records that must remain trustworthy should be append-only or tightly restricted from update/delete.
13. Customer writes must not be able to set staff-only notes, administrative status, role, audit metadata, or other privileged fields.
14. Staff permissions must be limited to actual operational duties. Do not treat `staff` as equivalent to administrator by default.
15. Administrator access must still be explicit. Do not create a blanket `allow read, write: if isAdmin()` over all future paths without reviewing each collection's need.
16. Rule helper functions should be small, named, and shallow. Avoid nested helper chains that obscure the final authorization condition.
17. Do not rely on document IDs being unpredictable.
18. Deny access when required user-profile, role, or status documents are missing or malformed.
19. Suspended or inactive users must not retain business-data access merely because they are still authenticated.
20. Rule changes require emulator tests for both allow and deny cases before production deployment when the emulator environment is available.

## Role baseline

### Customer

May access only explicitly permitted customer-facing data and own protected records. A customer must never gain access to another customer's private information by changing query filters or document IDs.

### Staff

May access operational records needed for assigned duties, such as reservations, inventory, payment recording, and equipment operations, subject to the final module permissions.

### Administrator

May perform approved management operations, including role or user management where required, but remains subject to explicit collection rules and validation.

## Role-storage rule

If application roles are stored in Firestore user/profile documents, clients may read only what they need and may never promote themselves. Any bootstrap administrator assignment must be performed through a trusted administrative process, not a self-service client path.

## Write-validation pattern

For sensitive updates, verify both:

- who is making the request; and
- exactly which fields are changing.

A role check without field-change validation is insufficient when the caller should control only part of the document.

## Audit limitation

With no trusted backend, client-created audit records cannot be treated as tamper-proof security logs. Rules may make such records append-only and restrict who may create them, but the client still supplies the event contents. Do not claim cryptographically trustworthy or server-authenticated auditing until a trusted server component exists.

## Query compatibility rule

Firestore evaluates queries against rules. Design query constraints and security predicates together. Never replace ownership enforcement with frontend filtering merely because a query is easier to write.

## Required negative tests

At minimum test:

- unauthenticated access;
- customer A reading customer B data;
- customer changing ownership fields;
- customer writing staff/admin fields;
- staff attempting administrator-only changes;
- suspended user access;
- unexpected-field injection;
- invalid status or type writes;
- forbidden delete operations.

## Review requirement

For every `allow` statement, a reviewer must be able to state exactly which users, documents, operations, and fields it permits. If that answer is broad or ambiguous, the rule is not ready.
