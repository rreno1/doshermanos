# Firebase Environments

## Purpose

The project currently uses one Firebase project for the deployed application lifecycle while keeping local development separate. The same Firebase project is used for staging/pre-launch now and may later become the live production deployment when the custom domain is connected.

The shared deployment Firebase project is:

```text
dos-hermanos-hilongos
```

The repository intentionally has no `default` Firebase CLI alias. Deployments must always name `staging` or `production` explicitly so the deployment intent is clear even though both aliases currently point to the same Firebase project.

## Current deployment lifecycle

Current state:

- `staging` -> `dos-hermanos-hilongos`
- `production` -> `dos-hermanos-hilongos`
- staging is the current pre-launch use of the project;
- production is a later release stage of the same Firebase project after the system is ready and the intended domain is connected.

A second Firebase project is not required unless the project later decides to introduce strict staging/production data isolation.

Firebase web client configuration is public application metadata. It is not a service-account credential and does not replace Authentication, Firestore Security Rules, or other authorization controls.

## Development

Local development must not connect to `dos-hermanos-hilongos`. A separate Firebase development project should be used for development work that needs a remote Firebase backend.

Until a development project exists:

- `web/.env.example` remains blank except for variable names;
- `mobile/.env.example` identifies the app environment as `development` but leaves Firebase client values blank;
- developers must not paste the shared deployment project into local development environment files;
- web and mobile runtime guards reject `dos-hermanos-hilongos` in development mode.

After a development Firebase project is created, add its project ID to `.firebaserc` as the `development` alias and place its public client configuration in local development environment files.

## Staging

Staging currently uses `dos-hermanos-hilongos`.

The tracked staging templates already contain the public Firebase client metadata for that project:

- `web/.env.staging.example`
- `mobile/.env.staging.example`

Before a web staging build:

```bash
cd web
cp .env.staging.example .env.staging
npm ci
npm run build:staging
```

The staging build runs Vite in `staging` mode and is allowed to connect to the shared deployment Firebase project.

From the repository root:

```bash
node scripts/check-staging-readiness.mjs
firebase deploy --only firestore --project staging
firebase deploy --only hosting --project staging
```

Do not use a bare `firebase deploy` command.

For mobile staging builds, use the values from `mobile/.env.staging.example` and keep:

```text
EXPO_PUBLIC_APP_ENV=staging
```

## Production promotion

When the application is ready to be treated as production, the same Firebase project may remain in use. The environment label changes the release stage; it does not require a Firebase project migration.

Production web build:

```bash
cd web
cp .env.production.example .env.production
npm ci
npm run build
cd ..
firebase deploy --only firestore --project production
firebase deploy --only hosting --project production
```

Both `staging` and `production` currently resolve to `dos-hermanos-hilongos`. If a separate production project is introduced later, the aliases, environment templates, and guards must be changed together before deployment.

## Local web setup

```bash
cd web
npm ci
cp .env.example .env.local
```

Fill `.env.local` only with the development Firebase web-app configuration, then run:

```bash
npm run dev
```

## Local mobile setup

```bash
cd mobile
npm ci
cp .env.example .env.local
```

Fill `.env.local` only with the development Firebase client configuration and keep `EXPO_PUBLIC_APP_ENV=development`, then run:

```bash
npm run start
```

## Safety boundary

Using one Firebase project for staging and later production means staging data can become live data. Before production promotion, review and clean test accounts, package records, reservations, payments, inventory, equipment records, and audit history as appropriate.

Environment labels do not replace authorization. Firebase Authentication, Firestore Security Rules, application validation, and deployment checks remain required in every release stage.
