# Coding Readability

## Purpose

Produce code that humans can read quickly, review safely, and maintain without decoding clever abstractions.

## Use this skill when

Writing or refactoring TypeScript, React, React Native, Firebase access code, validation, UI motion, or tests.

## Hard rules

1. Prefer clear, explicit code over clever code.
2. Use descriptive names that reveal business meaning.
3. Keep functions focused and short enough to understand without scrolling through unrelated behavior.
4. Prefer normal control flow over nested ternaries, dense chaining, metaprogramming, or compressed one-liners.
5. Avoid generic abstractions until at least two real call sites need the same behavior and the abstraction is clearer than duplication.
6. Do not create base services, generic repositories, factories, adapters, managers, or dependency-injection layers without a concrete need.
7. Do not hide business rules inside generic helpers.
8. Comments should explain business constraints or security reasons, not restate obvious syntax.
9. Prefer a few readable lines over a shorter expression that requires interpretation.
10. Do not introduce symbols, abbreviations, or shortened names that save typing but reduce clarity.
11. Keep error handling explicit. Do not swallow errors.
12. Remove dead code instead of commenting it out.
13. Keep animation and transition logic close to the component that owns the interaction.
14. Prefer simple CSS transitions or small platform-native animation code when sufficient.
15. Do not create a global animation abstraction layer for ordinary fades, slides, presses, or state transitions.
16. Do not add a heavy animation library unless the required interaction cannot be implemented clearly and reliably with the existing stack.
17. Motion code must remain readable and must not hide business behavior or navigation logic.

## Naming

- Functions: verbs that describe the action, such as `getReservation`, `recordPayment`, `confirmReservation`.
- Booleans: names that read as true/false questions, such as `isConfirmed`, `canEdit`, `hasBalance`.
- Collections: plural nouns.
- Animation state should describe the UI condition, such as `isExpanded`, `isEntering`, or `isSaving`, rather than vague names such as `anim1` or `motionState`.
- Avoid vague names such as `data`, `obj`, `item2`, `handlerX`, `processThing`, or `util` when a domain name exists.

## Abstraction test

Before creating an abstraction, ask:

- Does it make the code easier to understand?
- Does it remove real duplication rather than hypothetical duplication?
- Does it preserve visible business rules?
- Can a junior developer follow the call path without opening many files?

If not, keep the code explicit.
