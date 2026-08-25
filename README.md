# Dos Hermanos Catering System

A web and mobile catering management system for Dos Hermanos in Hilongos, Leyte.

## Current stack

- Web: React + TypeScript + Vite
- Mobile: Expo React Native
- Authentication: Firebase Authentication; Google-only on the web
- Database: Cloud Firestore
- Web hosting: Firebase Hosting

PayMongo and Cloud Functions remain excluded from the current implementation phase.

## Current implementation

The current slices provide:

- explicit Firebase development and deployment-stage configuration boundaries;
- default-deny Firestore authorization with automated Security Rules tests;
- web Google sign-in with automatic customer profile creation on first approved sign-in;
- public active-package catalogs on web and mobile;
- protected customer reservation requests with package and customization snapshots;
- customer-owned reservation tracking with bounded queries;
- protection against client-side reservation confirmation;
- staff/admin reservation review with immutable rejection decisions;
- staff/admin inventory and append-only inventory movement tracking;
- staff cash payment recording with customer-safe payment receipts and idempotent retry handling;
- disabled hosted payment-link readiness without a live payment provider;
- staff/admin equipment registry, assignment, release, return, and damaged/missing accountability;
- staff operational dashboard with bounded reservation, inventory, payment, and equipment summaries;
- reservation, sales-activity, payment, inventory, and equipment reports with CSV and print output;
- administrator operational audit view derived from append-only domain histories;
- Firebase Hosting security headers, CSP, safe shell caching, and CI policy checks;
- a top-level web error fallback and keyboard-accessible navigation improvements.

No sample business data is committed.

Dos Hermanos may accept multiple events on the same date and at overlapping times. The system does not use a global one-event-per-date lock. Final confirmation remains intentionally blocked from normal client operations until the operational capacity rule is defined. See `docs/scheduling-policy.md`.

Equipment assignment is currently a preparation/accountability workflow rather than a future-date capacity lock. Actual physical release is blocked when the registered equipment is not available or when the linked reservation is no longer eligible.

## Firebase deployment lifecycle

The current Firebase deployment project is:

```text
dos-hermanos-hilongos
```

It is currently used as the staging/pre-launch environment. The same Firebase project may later become the live production deployment when the system is ready and the intended domain is connected.

Both explicit Firebase CLI aliases currently point to the same project:

- `staging` -> `dos-hermanos-hilongos`
- `production` -> `dos-hermanos-hilongos`

There is intentionally no `default` project alias. Local development remains separate and is not allowed to connect to this shared staging/production project. See `docs/firebase-environments.md`.

## Web development

```bash
cd web
npm ci
cp .env.example .env.local
```

Fill `.env.local` with a separate development Firebase web-app configuration, then run:

```bash
npm run dev
```

## Staging web build and deployment

The tracked staging template already contains the public Firebase client configuration for `dos-hermanos-hilongos`.

```bash
cd web
cp .env.staging.example .env.staging
npm ci
cd ..
node scripts/check-staging-readiness.mjs
cd web
npm run build:staging
cd ..
firebase deploy --only firestore --project staging
firebase deploy --only hosting --project staging
```

The staging readiness check verifies that the staging alias and web staging configuration both point to the approved deployment project.

Before treating the deployment as a valid release candidate, complete `docs/staging-smoke-checklist.md`.

## Mobile development

```bash
cd mobile
npm ci
cp .env.example .env.local
```

Fill `.env.local` with a separate development Firebase client configuration and keep `EXPO_PUBLIC_APP_ENV=development`, then run:

```bash
npm run start
```

`mobile/.env.staging.example` and `mobile/.env.production.example` use the same Firebase project but different release-stage markers.

The current Google-only authentication change applies to the web deployment. Native Google authentication for Android/iOS requires the corresponding OAuth client configuration and must be completed before the mobile app is released.

## Production promotion

When the current Firebase deployment is ready to be treated as production, the same project may remain in use.

Do not use a bare `firebase deploy` command.

```bash
cd web
cp .env.production.example .env.production
npm ci
npm run build
cd ..
firebase deploy --only firestore --project production
firebase deploy --only hosting --project production
```

Before production promotion, review and clean staging-only accounts and test business data as appropriate.

## Authentication setup

For the web app, enable **Google** under Firebase Console -> Authentication -> Sign-in method and keep Email/Password disabled. Add the Firebase Hosting domain and the future custom domain to Authentication -> Settings -> Authorized domains as needed. See `docs/authentication.md`.

## Firestore rule tests

```bash
cd firebase/tests
npm ci
npm test
```

The test command runs every `*.test.mjs` Firestore rules suite through the emulator.

## Development rules

Implementation must follow the modular rules under `skills/`. Security and prevention of frontend data leakage take precedence over convenience.
