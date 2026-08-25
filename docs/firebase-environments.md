# Firebase Environments

## Purpose

Development and staging must not use the production Firebase project. The production project contains real application data and should never become the default target for local development, experiments, staging verification, emulator-adjacent work, or test records.

## Production

Production Firebase project:

```text
dos-hermanos-hilongos
```

The repository keeps this project under the Firebase CLI alias `production`. There is intentionally no `default` project alias.

Production web and mobile client metadata is kept only in:

- `web/.env.production.example`
- `mobile/.env.production.example`

These values are Firebase public client configuration, not administrative secrets.

The web runtime allows the production Firebase project only when Vite is running in `production` mode. The mobile runtime requires `EXPO_PUBLIC_APP_ENV=production` before it will connect to the production project.

## Development

A separate Firebase development project must be created before local development is connected to a remote Firebase backend.

Until that project exists:

- `web/.env.example` remains blank except for variable names;
- `mobile/.env.example` identifies the app environment as `development` but leaves Firebase client values blank;
- developers must not paste the production project into local environment files;
- web and mobile runtime guards reject `dos-hermanos-hilongos` outside production mode.

After a development Firebase project is created, add its project ID to `.firebaserc` as the `development` alias and place its public client configuration in local development environment files.

## Staging

Staging must use its own Firebase project. Do not use the production project as a temporary staging backend.

Before the first staging deployment:

1. Create a separate Firebase project for staging.
2. Add its project ID to `.firebaserc` under the `staging` alias.
3. Copy `web/.env.staging.example` to `web/.env.staging` and fill it with the staging web-app configuration.
4. For mobile staging builds, supply the values from `mobile/.env.staging.example` through the staging build environment. Keep `EXPO_PUBLIC_APP_ENV=staging`.
5. Run `node scripts/check-staging-readiness.mjs` and resolve every failure before deploying.

Expected `.firebaserc` shape after development and staging projects are provisioned:

```json
{
  "projects": {
    "development": "<development-project-id>",
    "staging": "<staging-project-id>",
    "production": "dos-hermanos-hilongos"
  }
}
```

Do not add a `default` alias. Requiring an explicit target makes accidental production deployment less likely.

### Staging web build

```bash
cd web
cp .env.staging.example .env.staging
# Fill .env.staging with the staging Firebase public client configuration.
npm ci
npm run build:staging
```

A staging build runs Vite in `staging` mode. The web runtime refuses to start if that build points to `dos-hermanos-hilongos`.

### Staging Firebase deployment

From the repository root, deploy each Firebase surface with the staging alias explicitly:

```bash
node scripts/check-staging-readiness.mjs
firebase deploy --only firestore --project staging
firebase deploy --only hosting --project staging
```

Do not deploy staging with `--project production` and do not use a bare `firebase deploy` command.

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

Fill `.env.local` only with the development Firebase web-app configuration and keep `EXPO_PUBLIC_APP_ENV=development`, then run:

```bash
npm run start
```

## Production web build

An intentional production build may start from the tracked production template:

```bash
cd web
cp .env.production.example .env.production
npm ci
npm run build
```

The generated `.env.production` remains ignored by Git.

## Firebase CLI deployment

Every Firebase deployment must name its target explicitly.

Production Firestore deployment:

```bash
firebase deploy --only firestore --project production
```

Production Hosting deployment:

```bash
firebase deploy --only hosting --project production
```

Development deployments, after the development alias exists, must similarly use:

```bash
firebase deploy --only firestore --project development
firebase deploy --only hosting --project development
```

Do not use a bare `firebase deploy` command for this repository.

## Safety boundary

Environment separation reduces accidental writes and deployments, but it does not replace authorization. Firebase Authentication, Firestore Security Rules, application validation, and production abuse controls remain required in every environment.
