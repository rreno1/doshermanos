# Authentication

## Current provider

The web application uses Firebase Authentication with the **Google** provider only. Email/Password registration, password sign-in, and password reset are intentionally removed from the web interface.

The mobile app still requires separate native Google OAuth client configuration before release. Do not treat the mobile authentication flow as release-ready until that native Google setup is complete.

## Firebase Console setup for web

1. Open the Firebase project.
2. Go to **Authentication** -> **Sign-in method**.
3. Enable **Google**.
4. Keep **Email/Password** disabled for the web release unless the project requirements explicitly change.
5. Under **Authentication** -> **Settings** -> **Authorized domains**, make sure the Firebase Hosting domain is authorized. Add the intended custom domain when it is connected later.

No private Firebase credentials belong in either client. The existing web and mobile `.env` files contain only Firebase client configuration values.

## Customer account creation

Customers do not create a separate Dos Hermanos password account.

On a successful first Google sign-in, the web client:

1. authenticates the Google identity through Firebase Authentication;
2. checks whether `users/{uid}` already exists;
3. preserves an existing profile if one is present;
4. otherwise creates `users/{uid}` with:
   - the Google display name, or a safe email-derived fallback;
   - `role: customer`;
   - `status: active`;
   - server timestamps.

The Firestore Security Rules independently enforce that a self-created profile can only be an active customer. A client cannot create itself as staff or administrator.

Existing staff and administrator profiles are never overwritten by the Google sign-in flow. Their role remains controlled by the existing Firestore profile.

## Existing authenticated users without a profile

Google first sign-in is allowed to create a missing customer profile because Firebase creates the Google Authentication identity as part of that flow. If profile creation fails, the web client signs the session out and reports a safe error instead of leaving a partially configured signed-in session.

The authentication provider still performs a small bounded retry because Firebase's authentication observer can run before the first profile write has completed.

## Authorization

Authentication and authorization remain separate:

- Firebase Authentication establishes identity.
- `users/{uid}` stores application role and account status.
- Firestore Security Rules decide whether a specific read or write is allowed.
- UI role checks are presentation only.

Suspended and inactive users may still have a Firebase Authentication session, but protected business-data rules require an active application profile.

## Client data handling

The authentication implementation does not:

- store Google passwords or authentication tokens in Firestore;
- place tokens in URLs;
- expose service-account credentials;
- use client-side role checks as authorization;
- persist business records in custom authentication storage.

## Mobile session persistence

The mobile app explicitly initializes Firebase Authentication with React Native persistence through `@react-native-async-storage/async-storage`. The storage dependency is used by the Firebase Authentication SDK for the authenticated session; application business records are not copied into AsyncStorage.

Firebase documents `getReactNativePersistence()` for this React Native use case, and the React Native runtime bundle exports it. Current Firebase 12.x Expo TypeScript resolution can still omit that export from the declaration selected by TypeScript. The mobile Firebase initializer therefore uses one narrow `@ts-expect-error` on that documented import, with an explanation in the source. This exception must be removed as soon as the upstream Expo typing path exposes the export correctly; `@ts-ignore` is not permitted by the repository readability guardrail.

Native Google authentication for Android and iOS must use the approved OAuth client configuration and must still be exercised on real devices during the release pass.
