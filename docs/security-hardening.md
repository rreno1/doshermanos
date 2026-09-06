# Dos Hermanos Security Hardening Standard

This document defines the security controls that are part of the Dos Hermanos Standard. These controls are defense in depth: Firebase Security Rules remain the authoritative authorization boundary, while client controls reduce session, identity, abuse, and operational risk.

## Identity and session controls

- Dos Hermanos accepts only authenticated, non-anonymous, email-verified Firebase users whose provider data includes Google (`google.com`).
- A Firebase session from another provider is rejected even if another provider is accidentally enabled in the Firebase console.
- Authentication initializes with browser-session persistence before a profile is trusted. Verified customer accounts may then use browser-local persistence; staff and administrator accounts remain browser-session scoped.
- Authenticated sessions are also subject to the existing 30-minute inactivity timeout.
- Authorization changes, cash-payment recording, and package creation/editing/publishing/deactivation require Google reauthentication when the Firebase authentication time is older than ten minutes.
- Reauthentication is a client-side step-up control; Firestore Rules still decide whether the write is authorized.

### Firebase Authentication console requirements

1. Keep Google as the intended sign-in provider for this application.
2. Keep the Firebase authorized-domain list limited to actual Dos Hermanos development, staging, and production origins.
3. Remove obsolete preview/custom domains from the authorized-domain list after they are no longer used.
4. Administrator and staff Google accounts should have Google Account 2-Step Verification enabled.
5. Do not treat Firebase web API keys as server secrets. They are client identifiers; access control belongs in Security Rules, App Check, authorized domains, and Google Cloud API restrictions appropriate to the Firebase services in use.

## Firebase App Check

The web client supports Firebase App Check using the score-based reCAPTCHA Enterprise provider. App Check is initialized before Auth, Firestore, and Storage when `VITE_FIREBASE_APP_CHECK_SITE_KEY` is configured in a staging or production build.

### Rollout procedure

1. Create a score-based reCAPTCHA Enterprise key for the deployed Dos Hermanos web origin.
2. Do not add localhost to the production reCAPTCHA key. Use a separate development setup if local App Check testing is required.
3. Register the reCAPTCHA Enterprise key for the Dos Hermanos web app in Firebase App Check.
4. Set `VITE_FIREBASE_APP_CHECK_SITE_KEY` in the staging deployment environment.
5. Deploy staging and confirm valid App Check requests in Firebase App Check metrics.
6. Enable App Check enforcement for supported Firebase products only after legitimate traffic is confirmed.
7. Repeat the validated configuration for production.
8. Never commit an App Check debug token or set a debug token in production.

App Check is not a substitute for Firestore or Storage Security Rules. A request must satisfy both the product authorization rules and App Check enforcement once enforcement is enabled.

## Firestore controls

The Firestore rules follow a default-deny model and validate allowed fields, field types, size limits, timestamps, ownership, role/status, and domain state transitions. High-integrity workflows use coupled writes so a forged client cannot change one side of an operation independently.

Important invariants include:

- customers cannot promote their own role;
- administrators cannot use a custom client to change their own role or access status; their self-service write remains limited to display-name metadata;
- administrators can manage another user's access only through the validated user-document contract;
- package records cannot be hard-deleted; operational removal uses the retained active/inactive state so historical reservation references remain stable;
- customer reservation reads are owner-scoped;
- reservation rejection requires its immutable decision record;
- inventory quantity changes require a matching movement record;
- payment recording requires its matching customer receipt;
- equipment release/return requires linked assignment, equipment, and transaction state;
- most operational history records cannot be updated or deleted;
- unmatched document paths are denied.

Changes to these rules must be accompanied by emulator security tests. UI hiding is never considered authorization.

## Storage controls

Resource images are private operational files.

- Only active staff or administrators can list/read/write resource images.
- Uploads are restricted to JPEG, PNG, or WebP and at most 5 MB.
- Inventory images may be created/updated only for an existing inventory document.
- Equipment images may be created/updated only for an existing, non-deleted equipment document.
- Every unmatched Storage path is denied.
- CI runs a Storage policy guard so broad public rules, wildcard image MIME rules, or removal of resource binding cannot silently enter the repository.

## Browser and Hosting controls

Firebase Hosting sends the Dos Hermanos security-header baseline:

- strict Content Security Policy;
- reCAPTCHA Enterprise CSP allowances only for the required Google endpoints;
- `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`, and `form-action 'self'`;
- `upgrade-insecure-requests`;
- `X-Content-Type-Options: nosniff`;
- `X-Frame-Options: DENY`;
- `Referrer-Policy: no-referrer`;
- restrictive camera, microphone, and geolocation Permissions Policy;
- `Cross-Origin-Opener-Policy: same-origin-allow-popups` so the application is isolated without breaking Google sign-in popups;
- `Cross-Origin-Resource-Policy: same-origin`;
- one-year HSTS with `includeSubDomains`;
- no-store/no-cache for `index.html` and immutable caching only for hashed assets.

The CI Hosting security guard fails if required headers or CSP directives are removed.

## Supply-chain and credential controls

- CI performs `npm audit --omit=dev --audit-level=high` for production web dependencies.
- Dependabot monitors web, mobile, Firebase test dependencies, and GitHub Actions weekly.
- A repository secret-leak guard rejects tracked real `.env` files, private-key containers, PEM private-key material, Google service-account credentials, and recognizable high-risk provider tokens without printing the suspected value into CI logs.
- Only `.env*.example` templates belong in source control; deployment secrets and App Check operational values belong in the deployment environment.
- Dependency changes must still pass typecheck, behavior tests, security-rule tests, and the Dos Hermanos architecture/readability guards.
- Avoid adding packages when a small, readable local implementation is sufficient.

## Security review gate

Before a release or merge to `main`, verify all of the following:

1. No privileged decision relies only on a hidden/disabled frontend control.
2. Firestore and Storage retain explicit default-deny fallbacks.
3. New writes validate fields, attribution, timestamps, ownership, and state transitions server-side where applicable.
4. Sensitive staff/admin actions use recent authentication when appropriate.
5. No secret, service-account credential, App Check debug token, private key, or privileged API credential is committed, and the secret-leak CI guard passes.
6. The production build targets only the approved Firebase project.
7. App Check metrics are healthy before enforcement is enabled or tightened.
8. All exact-head CI security jobs pass.
