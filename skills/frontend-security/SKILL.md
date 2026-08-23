# Frontend Security and Data Exposure

## Purpose

Ensure protected data never reaches a browser or mobile client that is not authorized to receive it.

## Use this skill when

Writing queries, rendering protected data, storing client state, handling errors, logging, caching, or configuring frontend builds.

## Core assumption

The frontend is an untrusted and inspectable environment. Browser DevTools, mobile inspection, network traffic, bundles, storage, and application state must be assumed visible to the authenticated user operating that client.

## Hard rules

1. Never place private keys, service-account credentials, admin credentials, secret API keys, or privileged tokens in frontend source, build variables, bundles, assets, or repositories.
2. Firebase client configuration is public application metadata and must never be treated as authorization.
3. Never fetch a larger protected dataset and hide unauthorized records in React or React Native.
4. Authorization must prevent unauthorized documents from being returned by Firestore in the first place.
5. Never use hidden buttons, hidden routes, disabled controls, or client role checks as the security boundary.
6. Client role checks may control presentation only; Firestore Security Rules remain authoritative.
7. Fetch only the records required for the current authenticated user and current screen.
8. Do not expose sensitive fields merely because the surrounding document is otherwise readable.
9. Because Firestore reads whole documents, separate public and private fields into different documents or collections when access differs.
10. Do not store sensitive business or personal data in localStorage, AsyncStorage, URL query strings, route parameters, or custom caches unless there is an explicit requirement and security review.
11. Do not log tokens, customer contact details, addresses, payment information, reservation details, private document contents, or full application state in production.
12. Do not show raw Firebase errors, stack traces, rule paths, internal implementation details, or debug payloads to users.
13. Do not include secrets in source maps, static assets, test fixtures, or example configuration.
14. Clear protected in-memory state when the user signs out or changes account.
15. Do not retain data from the previous user session after authentication state changes.

## Query rule

Bad pattern: read all reservations, then filter by `customerId` in the client.

Required pattern: query only records the user is allowed to read, with Firestore Rules independently enforcing ownership.

## Review question

If a user opens DevTools or intercepts their own app traffic, can they see any record or field they were not intended to receive? If yes, the design fails.
