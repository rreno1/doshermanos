# Authentication

## Purpose

Use Firebase Authentication for identity while keeping authorization separate and explicit.

## Use this skill when

Implementing sign-in, sign-out, session restoration, profile loading, role resolution, or protected routing.

## Hard rules

1. Firebase Authentication proves identity; it does not by itself grant business permissions.
2. Firestore Security Rules enforce authorization.
3. Do not trust a role value only because the client has it in state.
4. Do not allow users to promote their own account.
5. Handle authentication state centrally enough to avoid duplicate listeners, but do not create a large global application state framework just for auth.
6. Protected screens must wait for authentication state resolution before making protected queries.
7. Sign-out must clear protected client state and user-specific caches.
8. Authentication errors shown to users must be safe and understandable.
9. Do not expose authentication tokens in logs, URLs, analytics payloads, or custom storage.
10. Do not add sign-in providers until they are explicitly approved for this project.
11. Disabled or unauthorized users must not gain access simply because they still have a rendered page open.
12. Route guards improve UX but are not substitutes for Firestore Rules.

## Profile rule

Keep authentication identity separate from the application profile where useful. Store only application fields that are actually needed.
