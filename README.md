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

The first vertical slice establishes the project foundation and public package catalog on both web and mobile. No sample business data is committed. The package screens read only active package documents from Firestore.

Authentication provider selection has not been implemented yet. The repository already contains the security boundary needed for customer, staff, and administrator profiles, but no provider is assumed until it is explicitly approved.

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

## Development rules

Implementation must follow the modular rules under `skills/`. Security and prevention of frontend data leakage take precedence over convenience.
