# Authentication

## Purpose

Use Firebase Authentication to establish identity while keeping business authorization explicit, auditable, and enforced separately by Firestore Security Rules.

## Use this skill when

Implementing sign-in, sign-out, session restoration, profile loading, role resolution, account status checks, protected routing, or authentication error handling.

## Core model

Authentication answers: `Who is this user?`

Authorization answers: `What is this user allowed to do with this record?`

Firebase Authentication provides identity. Firestore Security Rules provide the authoritative authorization decision for client-accessible data.

## Hard rules

1. Do not treat a signed-in user as automatically authorized for business data.
2. Do not trust a role value merely because it exists in client state, local storage, route state, or a rendered component.
3. Do not allow users to assign or promote their own role.
4. Do not infer administrator or staff access from email text, route location, hidden UI, or frontend constants.
5. Keep one deliberate authentication-state observer per application boundary. Do not create duplicate listeners in many screens.
6. Protected screens must wait until authentication state is resolved before issuing protected reads.
7. Do not flash previously cached protected content while a new session is resolving.
8. Sign-out must clear protected feature state, user-specific cached data, and pending UI derived from the previous account.
9. Authentication errors shown to users must be safe, concise, and understandable. Do not expose raw tokens, provider payloads, stack traces, or internal Firebase details.
10. Do not log ID tokens, refresh tokens, access tokens, credential objects, or complete authentication state.
11. Do not place authentication tokens in URLs, query strings, analytics events, or custom persistence.
12. Do not add authentication providers until they are explicitly approved for the project.
13. Route guards exist for UX only. Firestore Security Rules must still deny direct unauthorized reads and writes.
14. A user who becomes suspended, inactive, or unauthorized must not retain business-data access simply because an old screen remains mounted.
15. When account or authorization state changes, stale in-flight reads must not repopulate the UI with previous-session data.
16. Do not duplicate role-resolution logic in multiple features.
17. Do not create a large global state framework solely for authentication.
18. Do not mix Firebase authentication identity fields with editable business-profile fields without a reason.
19. Do not expose more profile information than the current screen and role require.
20. Never implement a development-only authentication bypass in production application paths.

## User profile rule

Keep authentication identity and application profile concerns clear. A Firestore user/profile document may contain application fields such as role, status, display name, or business metadata, but clients must not be able to alter protected role/status fields unless an explicitly authorized administrative workflow permits it.

## Account-status rule

If the application supports inactive or suspended users, Firestore Rules must check the authoritative status source so access can fail closed even when Firebase Authentication still considers the session signed in.

## Session transition sequence

On authentication change:

1. mark protected UI as unresolved;
2. clear previous-user protected state;
3. resolve the current authenticated identity;
4. resolve the minimum required profile/role information;
5. allow permitted feature queries;
6. show denied or inactive state without leaking previous data.

## Provider rule

Do not add Google, Facebook, email/password, anonymous auth, or any other provider merely because Firebase supports it. Provider choice is a product and security decision and must be approved before implementation.

## Review requirement

A reviewer must be able to remove or manipulate every client-side role guard and still conclude that Firestore prevents unauthorized data access. If not, authentication and authorization are incorrectly coupled.
