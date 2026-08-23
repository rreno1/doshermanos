# Testing and Quality

## Purpose

Verify that simple code remains correct, secure, and understandable before release.

## Use this skill when

Adding features, changing Firestore rules, changing queries, fixing bugs, or preparing a release.

## Hard rules

1. Test behavior, not implementation details.
2. Security tests must include denied cases, not only successful access.
3. Firestore Rules changes require emulator-based rule tests before production deployment when the test environment is available.
4. Test customer ownership isolation between at least two distinct users.
5. Test staff and administrator boundaries separately.
6. Test protected-field tampering attempts.
7. Test common validation failures and invalid state transitions.
8. Test duplicate-submit behavior for payment, inventory, and other high-impact writes when applicable.
9. Test empty, loading, error, and permission-denied UI states.
10. Avoid giant end-to-end test suites when a smaller unit or integration test proves the same behavior more clearly.
11. Do not use production customer information as test fixtures.
12. Do not leave fake or sample records in production initialization paths.
13. A bug fix should include a regression test when practical.
14. Type checking and build success are release gates, not substitutes for behavioral tests.

## Quality review

A change is not complete if it works only for the happy path or if reviewers cannot easily understand why it is safe.
