# Firestore Data Design

## Purpose

Design Firestore around real access patterns, security boundaries, historical accuracy, and predictable query cost while keeping documents small and understandable.

## Use this skill when

Defining collections, document shapes, references, snapshots, indexes, read/write patterns, histories, or report queries.

## Starting collections

- users
- packages
- reservations
- inventory
- inventoryMovements
- payments
- equipment
- equipmentTransactions
- auditLogs

These are a starting point, not permission to create every possible collection or to force all features into these exact names before access patterns are defined.

## Hard rules

1. Model data for actual queries and authorization boundaries.
2. Do not normalize Firestore as if it were a relational database.
3. Do not denormalize blindly. Duplicate only stable data that improves a real read path, creates an intentional historical snapshot, or avoids unsafe cross-document exposure.
4. Keep documents bounded. Arrays, maps, histories, messages, line items, or transactions must not grow forever inside one document.
5. Use separate collections or subcollections for repeated histories and transaction streams that can grow independently.
6. Store historical snapshots when later edits must not rewrite the meaning of an old reservation, package selection, price, payment, or equipment transaction.
7. Separate public, customer-private, staff-only, and administrator-only fields when read permissions differ.
8. Do not put private staff notes or privileged control fields into documents customers may read.
9. Use Firestore server timestamps for event instants such as `createdAt` and `updatedAt` where appropriate.
10. Use consistent field names and value types within a collection.
11. Avoid deeply nested maps that make updates, indexes, and security rules difficult to audit.
12. Add compound indexes only for real query requirements.
13. Document the query that justifies every non-obvious compound index.
14. Avoid collection-wide reads for normal application screens.
15. Do not create counters, aggregates, or summary fields unless a UI or performance requirement needs them.
16. Do not use one large document as a mutable database for unrelated modules.
17. Do not use document references merely to imitate foreign keys. Use references only when they improve navigation or validation and do not create excessive dependent reads.
18. Do not rely on client-generated sequential IDs when Firebase-generated IDs provide safer distribution and adequate traceability.
19. Do not use document IDs as the only authorization condition.
20. Keep private data out of documents intended for public package browsing.
21. Avoid storing the same mutable fact in many places unless an explicit synchronization rule exists.
22. Every duplicated field must identify its authoritative source or be intentionally immutable as a snapshot.

## Query-first design process

Before creating a collection or index, define:

1. Which screen or workflow needs the data?
2. Which role is allowed to read it?
3. Which filters and sort order are required?
4. How many records may reasonably grow over time?
5. Does the query need pagination?
6. Can Firestore Security Rules enforce the same access boundary?
7. Which fields must remain historically stable?

Only then finalize the document shape.

## Snapshot principle

When a reservation reaches a business state where its package, menu, guest count, or agreed pricing must remain historically meaningful, store the necessary immutable snapshot instead of depending entirely on mutable package documents.

Do not snapshot everything automatically. Snapshot only fields whose later mutation would alter historical interpretation.

## Bounded-growth rule

A document that can grow every time a user performs an action is a warning sign. Histories such as payments, inventory movements, and equipment transactions should normally grow by adding documents, not by endlessly appending to an array on one parent document.

## Date and time rule

Use explicit semantics:

- Firestore `Timestamp` for instants in time.
- Clear date-only representation for business dates when no time-of-day is intended.
- Do not store ambiguous locale-formatted date strings.
- Do not mix timestamps, ISO strings, and arbitrary formatted strings for the same field across documents.

## Money and quantity rule

Use one consistent representation across each domain. Do not mix strings, floating-point display values, and numeric storage for the same monetary field. The final payment schema must explicitly define the authoritative storage representation before implementation.

## Security note

Firestore Rules operate on whole documents. If two roles require different fields, design separate readable documents rather than expecting the frontend to hide fields after retrieval.

## Review requirement

Every collection should have a documented owner, access pattern, growth pattern, retention expectation, and corresponding security-rule strategy before production data is written.
