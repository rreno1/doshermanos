# Coding Readability

## Purpose

Produce code that humans can read quickly, review safely, and maintain without decoding clever abstractions.

## Use this skill when

Writing or refactoring TypeScript, React, React Native, Firebase access code, validation, or tests.

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

## Naming

- Functions: verbs that describe the action, such as `getReservation`, `recordPayment`, `confirmReservation`.
- Booleans: names that read as true/false questions, such as `isConfirmed`, `canEdit`, `hasBalance`.
- Collections: plural nouns.
- Avoid vague names such as `data`, `obj`, `item2`, `handlerX`, `processThing`, or `util` when a domain name exists.

## Abstraction test

Before creating an abstraction, ask:

- Does it make the code easier to understand?
- Does it remove real duplication rather than hypothetical duplication?
- Does it preserve visible business rules?
- Can a junior developer follow the call path without opening many files?

If not, keep the code explicit.
