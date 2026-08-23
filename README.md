# Dos Hermanos Catering System

A small web and mobile catering management system for Dos Hermanos in Hilongos, Leyte.

## Current stack

- Web: React + TypeScript + Vite
- Mobile: Expo React Native
- Authentication: Firebase Authentication
- Database: Cloud Firestore
- Web hosting: Firebase Hosting

PayMongo and Cloud Functions are intentionally excluded from the current implementation phase.

## Current implementation

The current vertical slices establish:

- Firebase project and Hosting configuration boundaries;
- a default-deny Firestore security model;
- automated Firestore Security Rules tests in CI;
- a public active-package catalog on web and mobile;
- the protected reservation-request data boundary for authenticated customers;
- package name/base-price snapshot validation against the authoritative active package;
- customer ownership isolation for reservation requests;
- protection against clients creating already-confirmed reservations.

No sample business data is committed.

Authentication provider selection has not been implemented yet. The repository contains the authorization boundary for customer, staff, and administrator profiles, but no provider is assumed until it is explicitly configured.

Dos Hermanos may accept multiple events on the same date and at overlapping times. The system therefore does not use a global one-event-per-date lock. Final confirmation remains intentionally blocked from normal client operations until the real operational capacity rule is defined. See `docs/scheduling-policy.md`.

## Web setup

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

Fill the Firebase client configuration in `web/.env.local` before running the catalog against Firestore.

## Mobile setup

```bash
cd mobile
npm install
cp .env.example .env.local
npm run start
```

Fill the Firebase client configuration in `mobile/.env.local` before connecting the app to Firestore.

## Firebase setup

Link the repository to the intended Firebase project locally with the Firebase CLI. `.firebaserc` intentionally contains no hard-coded project ID.

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

The rule test suite uses the Firebase Emulator Suite and is also executed by GitHub Actions.

```bash
cd firebase/tests
npm install
npm test
```

## Development rules

Implementation must follow the modular rules under `skills/`. Security and prevention of frontend data leakage take precedence over convenience.
