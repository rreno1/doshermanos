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

- Firebase project and Hosting configuration boundaries;
- default-deny Firestore authorization;
- automated Firestore Security Rules tests in CI;
- customer Email/Password registration, sign-in, sign-out, and password reset;
- public active-package catalogs on web and mobile;
- protected customer reservation requests;
- package name/base-price snapshot validation against the authoritative active package;
- event dates, location, guest count, and optional service requirements;
- customer-owned reservation tracking with bounded queries;
- mobile native date selection through Expo UI;
- protection against clients creating already-confirmed reservations;
- staff/admin inventory and append-only inventory movement tracking;
- staff cash payment recording with customer-safe payment receipts;
- idempotent retry handling for one manual cash-payment operation;
- disabled hosted payment-link readiness without a live payment provider;
- staff/admin equipment registry and event assignment;
- atomic equipment release and return accountability;
- damaged/missing equipment tracking with immutable transaction history;
- administrator operational audit view derived from append-only domain histories.

No sample business data is committed.

Dos Hermanos may accept multiple events on the same date and at overlapping times. The system does not use a global one-event-per-date lock. Final confirmation remains intentionally blocked from normal client operations until the operational capacity rule is defined. See `docs/scheduling-policy.md`.

Equipment assignment is currently a preparation/accountability workflow rather than a future-date capacity lock. Actual physical release is blocked when the registered equipment is not available or when the linked reservation is no longer eligible.

## Firebase environment separation

Local development must use a separate Firebase development project. The production project is:

```text
dos-hermanos-hilongos
```

The repository intentionally has no default Firebase CLI project. Production is available only through the explicit `production` alias, and both web and mobile development runtimes reject the production project ID.

A separate development Firebase project still needs to be provisioned. Until then, the normal development `.env.example` files remain blank. See `docs/firebase-environments.md`.

## Web setup

```bash
cd web
npm install
cp .env.example .env.local
```

Fill `.env.local` with the separate development Firebase web-app configuration, then run:

```bash
npm run dev
```

Do not use the production Firebase configuration for `npm run dev`.

For an intentional production build, use `web/.env.production.example` as the production configuration template.

## Mobile setup

```bash
cd mobile
npm install
cp .env.example .env.local
```

Fill `.env.local` with the separate development Firebase client configuration, then run:

```bash
npm run start
```

Do not use the production Firebase configuration in an Expo development session. `mobile/.env.production.example` is reserved for intentional production configuration.

Expo SDK 57 uses `@expo/ui` for the native reservation date picker.

## Authentication setup

The account UI is already implemented. When ready, enable **Email/Password** under Firebase Console -> Authentication -> Sign-in method. See `docs/authentication.md`.

## Firebase deployment

The production project is linked through the explicit Firebase CLI alias `production`. Do not use a bare `firebase deploy` command.

Deploy production Firestore rules and indexes only after reviewing the target project:

```bash
firebase deploy --only firestore --project production
```

Build the production web application before deploying Hosting:

```bash
cd web
cp .env.production.example .env.production
npm run build
cd ..
firebase deploy --only hosting --project production
```

The Firebase Console-generated snippet also included Storage, Messaging, and Analytics metadata. Those products are not initialized merely because values were supplied. Storage and Messaging remain outside the current implementation, and Analytics is intentionally not initialized until there is a defined analytics/privacy requirement.

## Firestore rule tests

```bash
cd firebase/tests
npm install
npm test
```

The test command runs every `*.test.mjs` Firestore rules suite through the emulator.

## Development rules

Implementation must follow the modular rules under `skills/`. Security and prevention of frontend data leakage take precedence over convenience.
