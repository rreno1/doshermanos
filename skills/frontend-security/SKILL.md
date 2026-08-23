# Frontend Security and Data Exposure

## Purpose

Ensure that protected data never reaches a browser or mobile client that is not authorized to receive it, and that authorized clients receive only the minimum data needed for the current task.

## Use this skill when

Writing queries, rendering protected data, storing client state, handling errors, logging, caching, configuring frontend builds, adding analytics, or designing route behavior.

## Threat model

The browser and mobile client are untrusted and inspectable. Assume the authenticated user can inspect:

- network requests and responses;
- JavaScript bundles and source maps;
- React or React Native state;
- browser DevTools;
- local and session storage;
- AsyncStorage and app files;
- route parameters and URLs;
- console output;
- cached Firestore data;
- rendered but visually hidden DOM/UI content.

Anything delivered to a client must be considered visible to that client user.

## Hard rules

1. Never place private keys, service-account credentials, admin credentials, secret API keys, or privileged tokens in frontend source, environment variables bundled into clients, assets, repositories, or mobile builds.
2. Firebase client configuration is public application metadata and must never be treated as authorization or secrecy.
3. Never fetch a larger protected dataset and filter unauthorized records in React or React Native.
4. Firestore Security Rules must prevent unauthorized documents from being returned in the first place.
5. Hidden buttons, disabled controls, hidden routes, client role checks, and navigation guards are UX controls only, never authorization controls.
6. Fetch only the records required for the current authenticated user and current screen.
7. Do not expose sensitive fields merely because the surrounding document is otherwise readable.
8. Because Firestore reads whole documents, separate data into different documents or collections when field visibility differs.
9. Do not store sensitive business or personal records in `localStorage`, `sessionStorage`, AsyncStorage, URL query strings, route parameters, custom caches, or persisted global state unless an explicit requirement and security review justify it.
10. Do not log authentication tokens, customer contact details, addresses, payment information, reservation details, private document contents, role documents, or full application state in production.
11. Do not show raw Firebase errors, stack traces, Firestore paths, security-rule expressions, internal IDs that are not needed by the user, or debug payloads in the UI.
12. Do not include secrets or real customer data in source maps, fixtures, screenshots, seed files, examples, or test snapshots.
13. Clear protected in-memory state when the user signs out, loses authorization, becomes suspended, or changes account.
14. Do not retain previous-user data on screen while the next user's session is resolving.
15. Cancel or ignore stale asynchronous results when authentication changes so data from one session cannot populate another session's UI.
16. Do not render protected content before authentication and authorization state is resolved.
17. Do not use `dangerouslySetInnerHTML` for user-controlled content unless there is a documented sanitization requirement and a reviewed sanitizer.
18. Do not send sensitive domain data to analytics, crash-reporting, session-replay, logging, or third-party UI services by default.
19. Do not embed protected data in element attributes, hidden inputs, HTML comments, page metadata, or client-generated debug files.
20. Do not cache broad Firestore result sets for convenience if narrower authorized queries can serve the screen.
21. Do not use client-supplied role or ownership values to decide what data to fetch unless Firestore Rules independently enforce the same restriction.
22. Route IDs are not secrets. Access must remain safe even when a user manually changes a document ID in the URL.
23. Error states must fail closed: when authorization is uncertain, do not display previously loaded protected data.

## Query rule

Forbidden:

```text
read all reservations -> filter by customerId in the client
```

Required:

```text
query only the current user's permitted reservations
+ Firestore Rules independently enforce ownership
```

The query narrows cost and exposure. The rule provides security. Both are required.

## Sensitive-field rule

If a customer may read `reservations/{id}` but must not read internal staff notes, staff notes must not live in the same readable document. Firestore does not provide field-level filtering on document reads.

## Build review

Before release, verify that production bundles, logs, source maps, environment files, routes, and browser/mobile storage contain no secret or unauthorized data.

## Review question

If a user opens DevTools, intercepts their own app traffic, changes route IDs manually, and inspects local storage, can they see any record or field they were not intended to receive? If yes, the design fails.
