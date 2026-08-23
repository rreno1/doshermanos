# Coding Readability

## Purpose

Produce code that humans can read quickly, review safely, debug locally, and maintain without decoding clever abstractions or generated-looking boilerplate.

## Use this skill when

Writing or refactoring TypeScript, React, React Native, Firebase access code, validation, UI motion, tests, configuration helpers, or utilities.

## Core standard

Prefer explicit, boring, readable code that a junior developer can follow and a senior developer can audit. Complexity must come from the business problem, not from the coding style.

## Hard rules

1. Prefer clear control flow over clever expressions.
2. Use descriptive names that reveal business meaning without opening another file.
3. Do not abbreviate domain concepts merely to save typing.
4. Prefer a few readable statements over one compressed expression.
5. Avoid nested ternaries, deeply chained transformations, metaprogramming, clever generic tricks, and symbol-heavy code when ordinary TypeScript is clearer.
6. Keep functions focused on one business or UI responsibility.
7. Split a function when it performs clearly separate stages that can be named meaningfully. Do not split solely to satisfy arbitrary line counts.
8. Avoid generic abstractions until at least two real call sites need the same behavior and the abstraction is easier to understand than duplication.
9. Do not create base services, generic repositories, factories, adapters, managers, command buses, dependency-injection layers, or generic CRUD engines without a demonstrated requirement.
10. Do not hide business rules inside vague helpers such as `processData`, `handleAction`, `transform`, `execute`, or `util`.
11. Do not introduce wrapper functions that merely rename a one-line Firebase or platform API without adding business meaning, validation, security, or repeated behavior.
12. Keep error handling explicit. Never swallow errors with empty catches or silent fallbacks.
13. Do not use `any` as an escape hatch in production TypeScript. Prefer specific types, `unknown` plus validation, or narrowly scoped library types.
14. Do not use non-null assertions simply to silence TypeScript when the value may actually be absent.
15. Remove dead code instead of commenting it out.
16. Do not leave placeholder TODO logic in a completed feature unless the unfinished requirement is explicitly documented.
17. Comments should explain business constraints, security reasons, unusual tradeoffs, or why a simpler-looking approach is unsafe. Do not narrate obvious syntax.
18. Keep animation and transition logic close to the component that owns the interaction.
19. Prefer CSS transitions or small platform-native animation code when sufficient.
20. Do not create a global animation abstraction layer for ordinary fades, slides, presses, expansion, or state feedback.
21. Do not add a heavy animation library unless the required interaction cannot be implemented clearly and reliably with the current stack.
22. Do not generate repetitive documentation comments for self-explanatory private functions.
23. Avoid unnecessary enums, class hierarchies, builder patterns, or custom type systems when literal unions and simple functions are clearer.
24. Prefer immutable local transformations where practical, but do not force functional-programming patterns that make simple updates harder to read.
25. Keep imports direct and understandable. Avoid barrel files when they hide circular dependencies or make code ownership unclear.

## Naming rules

- Functions use verbs that describe the action: `getReservation`, `recordPayment`, `confirmReservation`, `loadAvailablePackages`.
- Booleans read as true/false questions: `isConfirmed`, `canEdit`, `hasBalance`, `isLoading`.
- Collections use plural nouns.
- Event handlers describe the event and action: `handleConfirmReservation`, not `doIt` or `onAction`.
- Validation functions state what they validate: `validateGuestCount` or `validateReservationForm`.
- Avoid names such as `data`, `obj`, `temp`, `foo`, `item2`, `handlerX`, `stuff`, `processThing`, and `util` when a domain name exists.
- Single-letter variables are allowed only for tiny local mathematical or callback contexts where meaning is obvious.

## Complexity guardrails

Treat these as review triggers, not automatic failure thresholds:

- A file mixes unrelated business features.
- A function requires many flags to change behavior.
- A component accepts many boolean props that create hidden combinations.
- Understanding one action requires opening a long chain of unrelated files.
- The same business rule appears in more than one feature.
- A generic abstraction has only one real consumer.

When a trigger appears, simplify the design before adding more code.

## Abstraction test

Before creating an abstraction, ask:

- Does it make the code easier to understand?
- Does it remove real duplication rather than hypothetical duplication?
- Does it preserve visible business rules?
- Can a developer follow the call path without opening many files?
- Does it reduce, rather than increase, the number of concepts needed to understand the feature?

If not, keep the code explicit.

## Review requirement

A reviewer should be able to explain the main path of the code after reading the relevant feature directory once. If the implementation requires architectural archaeology, it is too complex.
