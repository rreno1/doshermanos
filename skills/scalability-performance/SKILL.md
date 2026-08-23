# Scalability and Performance

## Purpose

Keep Firestore usage efficient as records grow without overengineering for imaginary scale.

## Use this skill when

Designing queries, listeners, pagination, indexes, caching, aggregates, or high-frequency writes.

## Hard rules

1. Never depend on unbounded collection reads for normal screens.
2. Add limits to list queries and paginate data that can grow.
3. Query by the fields users actually filter or sort by.
4. Do not attach real-time listeners to data that does not need real-time updates.
5. Unsubscribe listeners when screens or components stop needing them.
6. Avoid repeated reads of the same document during one workflow when existing state is still valid.
7. Do not load large related datasets just to display a summary.
8. Keep Firestore documents below practical growth limits by moving histories and repeated transactions out of parent documents.
9. Avoid high-contention single documents for unrelated frequent writes.
10. Use batch writes or transactions only when atomicity is actually required.
11. Do not add premature caching layers that can create stale authorization-sensitive data.
12. Measure before adding complex performance abstractions.
13. Prefer predictable query costs over broad convenience queries.
14. Keep report queries bounded by date or another meaningful scope where possible.

## Scalability principle

Design so growth mainly increases the number of documents, not the size of individual documents or the amount of data fetched for one screen.
