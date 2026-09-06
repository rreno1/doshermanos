# Dos Hermanos Catering System

Dos Hermanos is a Firebase-backed catering operations system with a React + TypeScript web application and an Expo/React Native mobile application.

## Repository structure

```text
firebase/    Firestore rules, Storage rules, indexes, and emulator security tests
mobile/      Expo/React Native customer application
web/         React + TypeScript + Vite web application
scripts/     repository-level security and quality guards
skills/      project-local implementation standards
```

The canonical web frontend architecture is:

```text
web/src/App.tsx
web/src/core/
web/src/modules/
web/src/shared/
web/src/styles/
```

Cross-layer web imports use `@core`, `@modules`, `@shared`, and `@styles` so ownership remains explicit.

## Backend boundary

Firebase is the approved backend boundary:

- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Firebase Hosting
- Firebase App Check for supported deployed web traffic

Frontend visibility is never authorization. Firestore and Storage Security Rules remain the authoritative access-control boundary.

## Security baseline

The current security standard includes:

- verified Google identity enforcement for web sessions;
- browser-session persistence for staff/administrators and 30-minute inactivity logout;
- recent Google reauthentication before sensitive access, cash-payment, and package-management writes;
- default-deny Firestore and Storage rules with emulator-tested state-transition and ownership constraints;
- immutable, actor-attributed records for protected access changes and other implemented high-integrity workflows;
- App Check support using reCAPTCHA Enterprise for staging/production web builds;
- restricted resource-image MIME types, file size, staff/admin access, and Firestore-resource binding;
- Firebase Hosting CSP, HSTS, clickjacking, MIME, referrer, permissions, COOP/CORP, and cache controls;
- committed-secret/private-key detection in CI;
- high-severity production dependency audits for both web and mobile;
- Dependabot for application dependencies and GitHub Actions.

See `docs/security-hardening.md` for the complete release/security contract.

## Web development

```bash
cd web
npm ci
npm run typecheck
npm test
npm run build
```

The web app requires Firebase client configuration through environment variables. Use the committed `.env*.example` templates as field references; do not commit real `.env` files.

## Mobile development

```bash
cd mobile
npm ci
npm run typecheck
npm test
npm start
```

The mobile application also uses Firebase client configuration from its environment templates.

## Firebase security tests

Firestore Security Rules are tested with the Firebase emulator suite:

```bash
cd firebase/tests
npm ci
npm test
```

Repository-level guards can also be run directly from the repository root:

```bash
node scripts/check-readability.mjs
node scripts/check-firebase-environments.mjs
node scripts/check-hosting-security.mjs
node scripts/check-storage-security.mjs
node scripts/check-secret-leaks.mjs
```

## Release gate

A change is not release-ready merely because the interface works. Before merge or deployment, the exact head must pass:

1. web typecheck/build and behavior tests;
2. mobile typecheck and behavior tests;
3. Firestore emulator security tests;
4. Firebase environment, Hosting, and Storage security guards;
5. secret-leak detection;
6. production dependency audits for web and mobile;
7. architecture/readability/UI regression guards;
8. the required responsive/accessibility smoke checks for the affected workflows.

Do not weaken a security rule or regression test just to make CI green. Fix the underlying implementation or document a genuine domain exception.