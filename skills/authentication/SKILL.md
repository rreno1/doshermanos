# Authentication

## Purpose

Use Firebase Authentication to establish identity while keeping business authorization explicit, auditable, and enforced separately by Firestore Security Rules.

## Use this skill when

Implementing sign-in, sign-out, session restoration, profile loading, role resolution, account status checks, protected routing, or authentication error handling.

## Current provider baseline

- Firebase Email/Password is the approved provider for the current implementation phase.
- The provider may remain disabled in Firebase Console while development continues.
- Do not add Google, Facebook, anonymous authentication, phone authentication, or another provider unless explicitly approved later.
- Provider-specific UI and logic must stay inside the authentication feature.

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
10. Do not log ID tokens, refresh tokens, access tokens, credential objects, passwords, or complete authentication state.
11. Do not place authentication tokens in URLs, query strings, analytics events, or custom persistence.
12. Do not add authentication providers beyond the current approved provider without explicit approval.
13. Route guards exist for UX only. Firestore Security Rules must still deny direct unauthorized reads and writes.
14. A user who becomes suspended, inactive, or unauthorized must not retain business-data access simply because an old screen remains mounted.
15. When account or authorization state changes, stale in-flight reads must not repopulate the UI with previous-session data.
16. Do not duplicate role-resolution logic in multiple features.
17. Do not create a large global state framework solely for authentication.
18. Do not mix Firebase authentication identity fields with editable business-profile fields without a reason.
19. Do not expose more profile information than the current screen and role require.
20. Never implement a development-only authentication bypass in production application paths.
21. Self-registration may create only a customer application profile. Staff and administrator roles require an authorized administrative process.
22. Do not store user passwords in Firestore, application state beyond the active form field, logs, analytics, or custom files.
23. Password-reset UI must avoid revealing whether an email address belongs to an account when Firebase behavior permits a generic response.
24. Authentication provider configuration errors must fail closed and show a safe setup message rather than bypassing authentication.
25. Customer profile creation must occur only inside the explicit registration flow. Normal sign-in must never silently create a missing Firestore profile.
26. A missing Firestore profile after sign-in is an account-setup error and must fail closed.
27. If registration creates a Firebase Authentication identity but cannot finish the required Firestore profile, attempt to remove the newly created identity. If cleanup cannot complete, sign the session out and surface a safe error.
28. A bounded retry is acceptable only to bridge the short registration window between Firebase Authentication identity creation and Firestore profile creation. It must not turn missing-profile recovery into an indefinite loop.

## User profile rule

Keep authentication identity and application profile concerns clear. A Firestore user/profile document may contain application fields such as role, status, display name, or business metadata, but clients must not be able to alter protected role/status fields unless an explicitly authorized administrative workflow permits it.

Self-registration may explicitly create the signed-in user's profile only when Firestore Rules constrain that document to the current UID, `customer` role, and `active` status. Do not create a profile merely because an authenticated user signed in and no document was found. Missing-profile recovery must never become an implicit account-provisioning path.

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

For a brand-new registration, a short bounded retry may be used while the explicit profile write completes. After that bounded window, a missing profile must become an error state rather than being created automatically.

## Provider rule

Email/Password is currently implemented because it works across the React web client and Expo mobile client without adding a separate OAuth integration. A future provider change is a product and security change, not a cosmetic UI change. Update documentation and affected tests before adding another provider.

## Review requirement

A reviewer must be able to remove or manipulate every client-side role guard and still conclude that Firestore prevents unauthorized data access. If not, authentication and authorization are incorrectly coupled.
