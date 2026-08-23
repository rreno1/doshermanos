# Scalability and Performance

## Purpose

Keep Firestore usage and client rendering efficient as records grow, while avoiding infrastructure designed for imaginary scale.

## Use this skill when

Designing queries, listeners, pagination, indexes, caching, aggregates, reports, list rendering, or high-frequency writes.

## Core principle

Growth should primarily increase the number of documents, not the size of individual documents or the amount of data fetched for one screen.

## Hard rules

1. Never depend on unbounded collection reads for normal application screens.
2. Add explicit limits to list queries whose result sets can grow.
3. Use cursor-based pagination for growing Firestore lists. Do not simulate database offsets by repeatedly reading skipped documents.
4. Query by fields users actually filter and sort by.
5. Do not attach real-time listeners to data that does not need real-time updates.
6. Unsubscribe listeners when screens or components stop needing them.
7. Do not create duplicate listeners for the same scope because multiple components independently requested convenience data.
8. Avoid repeated reads of the same document during one workflow when current authorized state is still valid.
9. Do not load large related collections merely to calculate a small summary in the client.
10. Keep documents bounded by moving histories and repeated transaction records out of parent documents.
11. Avoid high-contention single documents for unrelated frequent writes.
12. Use transactions only when a write depends on values that must still be current at commit time.
13. Use batched writes only when multiple independent writes must commit together and a transaction read is unnecessary.
14. Do not add premature caching layers that can retain stale authorization-sensitive data.
15. Do not cache data more broadly than the user is allowed to read.
16. Measure before adding complex performance abstractions.
17. Prefer predictable query cost over broad convenience queries.
18. Bound report queries by date range, status, owner, or another meaningful scope whenever possible.
19. Do not fetch entire histories to display a count if a bounded summary strategy is actually required.
20. Add indexes for real queries, not speculative possibilities.
21. Do not add an index merely to support an unsafe or unnecessarily broad query.
22. Avoid large arrays used as ad-hoc indexes inside documents.
23. Keep rendered lists virtualized or paginated when record counts can grow.
24. Avoid expensive recalculation in render paths when a simple memoized or precomputed value is clearly warranted; do not memoize everything by default.
25. Do not optimize by duplicating sensitive data into broader-readable documents.
26. Performance changes must preserve authorization and historical correctness.

## Query design checklist

For every growing list query define:

- role and ownership scope;
- filters;
- sort order;
- page size;
- cursor field(s);
- expected index;
- empty-state behavior;
- whether real-time updates are actually necessary.

A list query without a growth plan is incomplete.

## Listener rule

Use a listener when the user benefits from changes appearing while the screen is open, such as reservation status. Use one-time reads for data that changes infrequently or does not need live synchronization.

Real-time is not automatically better; it costs reads, complexity, and state-management effort.

## Document-growth rule

If every transaction adds another element to one document, redesign before production use. Payments, inventory movements, and equipment transactions should grow as separate documents rather than unbounded arrays.

## Report rule

Reports must not assume the full lifetime dataset fits comfortably in one client query. Design report filters and date ranges before report implementation.

## Performance review

Before optimizing, identify the actual expensive path: number of Firestore reads, listener frequency, document size, render count, bundle size, or network payload. Optimize the measured or clearly bounded issue, not a hypothetical one.
