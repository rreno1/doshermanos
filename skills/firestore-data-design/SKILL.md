# Firestore Data Design

## Purpose

Design Firestore around real access patterns while keeping documents small, understandable, and secure.

## Use this skill when

Defining collections, document shapes, references, snapshots, indexes, or read/write patterns.

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

These are a starting point, not permission to add every possible collection.

## Hard rules

1. Model for actual queries and authorization boundaries.
2. Do not normalize Firestore as if it were a relational database.
3. Do not denormalize blindly either; duplicate only stable data that improves a real read path or preserves history.
4. Keep documents bounded. Do not allow arrays or maps to grow without a clear limit.
5. Use subcollections or separate collections for histories and repeated transactions that can grow indefinitely.
6. Store historical snapshots when later edits must not rewrite the meaning of an old transaction or reservation.
7. Separate public and private data when their read permissions differ.
8. Do not put private staff-only fields into a document customers are allowed to read.
9. Use server-generated timestamps where Firebase supports the required operation from the client.
10. Use consistent field names and types across documents of the same collection.
11. Avoid deeply nested document structures that make updates and rules difficult to reason about.
12. Add indexes only for real query requirements.
13. Document every compound query that requires an index.
14. Avoid collection-wide reads.
15. Do not create counters, aggregates, or duplicated summary fields unless the UI or performance requirement actually needs them.

## Snapshot principle

When a reservation becomes confirmed, information whose historical meaning must remain stable may be stored as a snapshot rather than depending entirely on mutable package records.

## Security note

Firestore rules cannot safely hide selected fields from an otherwise readable document. Different visibility usually requires different documents.
