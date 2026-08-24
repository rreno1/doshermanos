# Firebase Environments

## Purpose

Development must not use the production Firebase project. The production project contains real application data and should never become the default target for local development, experiments, emulator-adjacent work, or test records.

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

## Development

A separate Firebase development project must be created before local development is connected to a remote Firebase backend.

Until that project exists:

- `web/.env.example` remains blank;
- `mobile/.env.example` remains blank;
- developers must not paste the production project into local `.env.local` files;
- web and mobile runtime guards reject `dos-hermanos-hilongos` when running in development mode.

After a development Firebase project is created, add its project ID to `.firebaserc` as the `development` alias and place its public client configuration in local development environment files.

Expected `.firebaserc` shape after provisioning development:

```json
{
  "projects": {
    "development": "<development-project-id>",
    "production": "dos-hermanos-hilongos"
  }
}
```

Do not add a `default` alias. Requiring an explicit target makes accidental production deployment less likely.

## Local web setup

```bash
cd web
npm install
cp .env.example .env.local
```

Fill `.env.local` only with the development Firebase web-app configuration, then run:

```bash
npm run dev
```

## Local mobile setup

```bash
cd mobile
npm install
cp .env.example .env.local
```

Fill `.env.local` only with the development Firebase web-app configuration used by the Expo client, then run:

```bash
npm run start
```

## Production web build

An intentional production build may start from the tracked production template:

```bash
cd web
cp .env.production.example .env.production
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

After the development alias exists, development deployments must similarly use:

```bash
firebase deploy --only firestore --project development
```

Do not use a bare `firebase deploy` command for this repository.

## Safety boundary

Environment separation reduces accidental writes and deployments, but it does not replace authorization. Firebase Authentication, Firestore Security Rules, application validation, and later production abuse controls remain required in every environment.
