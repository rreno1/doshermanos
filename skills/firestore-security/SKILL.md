# Firestore Security

## Purpose

Make Firestore Security Rules the authoritative authorization boundary for all client-accessible data.

## Use this skill when

Creating collections, document paths, queries, roles, ownership rules, or protected writes.

## Hard rules

1. Start from default deny.
2. Every readable collection must have an explicit reason and access rule.
3. Every writable collection must define who may create, update, and delete records.
4. Authentication alone is never enough for privileged access.
5. Enforce customer ownership in rules for customer-specific records.
6. Enforce staff and administrator permissions in rules, not only in UI code.
7. Prevent users from assigning or changing their own privileged role.
8. Prevent clients from changing protected ownership fields after creation.
9. Prevent clients from changing protected audit, approval, confirmation, and system-controlled fields unless their role explicitly permits it.
10. Validate allowed field sets and field types where practical.
11. Reject writes that introduce unexpected privileged fields.
12. Historical records that must remain trustworthy should be append-only or have tightly restricted update/delete access.
13. Rules must match actual query patterns; never weaken rules just to make a broad query succeed.
14. Separate data with different access levels instead of trying to hide individual fields inside a readable Firestore document.
15. Test denied cases as seriously as allowed cases.

## Role principle

- Customer: own permitted records only.
- Staff: operational access explicitly required for assigned duties.
- Administrator: management access, but still only through defined rules.

## Rule design preference

Use small reusable rule helper functions for repeated authorization checks, but avoid deeply nested helper chains that make access logic difficult to audit.
