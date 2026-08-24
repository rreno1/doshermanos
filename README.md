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
- disabled hosted payment-link readiness without a live payment provider;
- staff/admin equipment registry and event assignment;
- atomic equipment release and return accountability;
- damaged/missing equipment tracking with immutable transaction history.

No sample business data is committed.

Dos Hermanos may accept multiple events on the same date and at overlapping times. The system does not use a global one-event-per-date lock. Final confirmation remains intentionally blocked from normal client operations until the operational capacity rule is defined. See `docs/scheduling-policy.md`.

Equipment assignment is currently a preparation/accountability workflow rather than a future-date capacity lock. Actual physical release is blocked when the registered equipment is not available.

## Web setup

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

`web/.env.example` already contains the Firebase client configuration for the `dos-hermanos-hilongos` project. Firebase web client configuration is public application metadata; Firestore Security Rules and Firebase Authentication remain the actual authorization boundaries.

## Mobile setup

```bash
cd mobile
npm install
cp .env.example .env.local
npm run start
```

`mobile/.env.example` contains the same Firebase client project metadata for the Expo app. Expo SDK 57 uses `@expo/ui` for the native reservation date picker.

## Authentication setup

The account UI is already implemented. When ready, enable **Email/Password** under Firebase Console -> Authentication -> Sign-in method. See `docs/authentication.md`.

## Firebase setup

The repository is linked to the Firebase project `dos-hermanos-hilongos` through `.firebaserc`.

The Firebase Console-generated snippet also included Storage, Messaging, and Analytics metadata. Those products are not initialized merely because values were supplied. Storage and Messaging remain outside the current implementation, and Analytics is intentionally not initialized until there is a defined analytics/privacy requirement.

Deploy Firestore rules and indexes only after reviewing the target project:

```bash
firebase deploy --only firestore
```

Build the web application before deploying Hosting:

```bash
cd web
npm run build
cd ..
firebase deploy --only hosting
```

## Firestore rule tests

```bash
cd firebase/tests
npm install
npm test
```

The test command runs every `*.test.mjs` Firestore rules suite through the emulator.

## Development rules

Implementation must follow the modular rules under `skills/`. Security and prevention of frontend data leakage take precedence over convenience.
