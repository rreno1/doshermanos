# Dos Hermanos Catering System

A web and mobile catering management system for Dos Hermanos in Hilongos, Leyte.

## Current stack

- Web: React + TypeScript + Vite
- Mobile: Expo React Native
- Authentication: Firebase Authentication with Email/Password
- Database: Cloud Firestore
- Web hosting: Firebase Hosting

PayMongo and Cloud Functions remain excluded from the current implementation phase.

## Current implementation

The current slices provide:

- explicit Firebase development, staging, and production configuration boundaries;
- default-deny Firestore authorization with automated Security Rules tests;
- customer Email/Password registration, sign-in, sign-out, and password reset;
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

## Firebase environment separation

Production Firebase project:

```text
dos-hermanos-hilongos
```

The repository intentionally has no default Firebase CLI project. Production is available only through the explicit `production` alias. Non-production web and mobile runtimes refuse to connect to the production project.

Separate development and staging Firebase projects must be provisioned before those environments use a remote backend. See `docs/firebase-environments.md`.

## Web development

```bash
cd web
npm ci
cp .env.example .env.local
```

Fill `.env.local` with the separate development Firebase web-app configuration, then run:

```bash
npm run dev
```

## Staging web build and deployment

Provision a separate staging Firebase project first and add it to `.firebaserc` as `staging`. Then:

```bash
cd web
cp .env.staging.example .env.staging
# Fill .env.staging with the staging Firebase public client configuration.
npm ci
cd ..
node scripts/check-staging-readiness.mjs
cd web
npm run build:staging
cd ..
firebase deploy --only firestore --project staging
firebase deploy --only hosting --project staging
```

The staging readiness check fails when the staging alias is missing, the staging web configuration is incomplete, the project IDs disagree, or staging points at production.

Before staging deployment, also complete `docs/staging-smoke-checklist.md`.

## Mobile development

```bash
cd mobile
npm ci
cp .env.example .env.local
```

Fill `.env.local` with the separate development Firebase client configuration and keep `EXPO_PUBLIC_APP_ENV=development`, then run:

```bash
npm run start
```

`mobile/.env.staging.example` and `mobile/.env.production.example` define the required environment markers for non-development builds.

## Production deployment

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

## Authentication setup

When configuring a Firebase environment, enable **Email/Password** under Firebase Console -> Authentication -> Sign-in method. See `docs/authentication.md`.

## Firestore rule tests

```bash
cd firebase/tests
npm ci
npm test
```

The test command runs every `*.test.mjs` Firestore rules suite through the emulator.

## Development rules

Implementation must follow the modular rules under `skills/`. Security and prevention of frontend data leakage take precedence over convenience.
