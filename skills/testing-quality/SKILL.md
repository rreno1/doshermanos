# Testing and Quality

## Purpose

Verify that simple code remains correct, secure, accessible, and understandable before release, with special attention to denied access and high-impact business operations.

## Use this skill when

Adding features, changing Firestore rules, changing queries, changing validation, fixing bugs, refactoring shared code, or preparing a release.

## Test priority

Test the behavior that can lose data, expose data, corrupt business state, or block a common user workflow before testing cosmetic implementation details.

## Hard rules

1. Test behavior, not private implementation structure.
2. Security tests must include denied cases, not only successful access.
3. Firestore Rules changes require emulator-based rule tests before production deployment when the emulator environment is available.
4. Test customer ownership isolation using at least two distinct customer identities.
5. Test staff and administrator boundaries separately.
6. Test unauthenticated access explicitly.
7. Test protected-field tampering attempts.
8. Test attempts to change ownership, role, approval, confirmation, or other privileged fields.
9. Test common validation failures and invalid state transitions.
10. Test duplicate-submit behavior for payment, inventory, reservation confirmation, and other high-impact writes when applicable.
11. Test loading, empty, error, permission-denied, and signed-out UI states.
12. Test authentication transitions so previous-user protected data does not remain visible.
13. Test route-ID manipulation for customer-owned records.
14. Test bounded list behavior and pagination for datasets that can grow.
15. Avoid giant end-to-end suites when a smaller rule, unit, or integration test proves the behavior more clearly.
16. Do not use production customer information as test fixtures.
17. Do not leave fake or sample records in production initialization paths.
18. A bug fix should include a regression test when practical and valuable.
19. Type checking and build success are release gates, not substitutes for behavioral tests.
20. Tests must not become so abstract that the business behavior is hidden behind factories and helpers.
21. Reusable test helpers are acceptable when they make identities or setup clearer; do not create a custom testing framework.
22. Accessibility-critical controls should be tested for semantic labels, keyboard/focus behavior where applicable, and disabled/loading behavior.
23. Do not approve a feature solely because the happy path works manually.
24. A failed test must produce enough information to identify the violated business/security rule without dumping secrets or real user data.

## Minimum rule-test matrix

For every protected collection, test the relevant subset of:

- unauthenticated read denied;
- unauthenticated write denied;
- owner read allowed;
- non-owner read denied;
- owner permitted create/update allowed;
- protected-field mutation denied;
- invalid type/schema denied;
- staff allowed operation;
- staff forbidden administrator operation denied;
- administrator approved operation allowed;
- suspended/inactive user denied;
- forbidden delete denied.

## Feature test layers

Prefer the smallest useful layer:

- pure unit test for deterministic calculations/validation;
- Firestore Rules emulator test for authorization;
- integration test for feature + Firebase behavior;
- UI/component test for form and state behavior;
- end-to-end test only for critical multi-screen workflows that lower layers cannot prove adequately.

## Release gates

Before a production-ready change is considered complete:

1. typecheck passes;
2. relevant automated tests pass;
3. production build succeeds;
4. Firestore Rules tests pass when rules changed;
5. no secret/sample/debug data is present;
6. common responsive layouts are checked;
7. loading/error/denied states are checked;
8. no known high-severity security or data-integrity defect remains.

## Quality review

A change is not complete if it works only for the happy path, requires hidden manual knowledge, weakens authorization, leaks protected data, or cannot be understood by a reviewer without tracing unnecessary abstractions.
