# Authentication

## Current provider

The current implementation uses Firebase Authentication with the **Email/Password** provider on both web and mobile.

The provider can remain disabled in Firebase Console while the project is being built. The UI is already wired and will show a safe configuration message until Email/Password authentication is enabled.

## Firebase Console setup

When ready to activate authentication:

1. Open the Firebase project.
2. Go to **Authentication** -> **Sign-in method**.
3. Enable **Email/Password**.
4. Keep other providers disabled unless the project explicitly approves them later.

No private Firebase credentials belong in either client. The existing web and mobile `.env` files contain only Firebase client configuration values.

## Account creation

Customer registration creates:

1. a Firebase Authentication identity using email and password;
2. a Firebase display name;
3. `users/{uid}` in Firestore with:
   - `displayName`;
   - `role: customer`;
   - `status: active`;
   - server timestamps.

Clients cannot register themselves as staff or administrator. The Firestore Security Rules independently enforce the customer-only role and active status during self-registration.

## Existing users without a profile

If an authenticated identity exists but `users/{uid}` does not, the application may create the missing profile only as an active customer and only for the signed-in UID. This does not provide a role-elevation path because Firestore Security Rules still reject self-assigned staff or administrator roles.

## Authorization

Authentication and authorization remain separate:

- Firebase Authentication establishes identity.
- `users/{uid}` stores application role and account status.
- Firestore Security Rules decide whether a specific read or write is allowed.
- UI role checks are presentation only.

Suspended and inactive users may still have a Firebase Authentication session, but protected business-data rules require an active application profile.

## Password reset

The application uses Firebase's password-reset email flow. The interface does not reveal whether a submitted email address belongs to an account; it displays the same generic completion message.

## Client data handling

The authentication implementation does not:

- log passwords or authentication tokens;
- store passwords in Firestore;
- place tokens in URLs;
- expose service-account credentials;
- use client-side role checks as authorization;
- persist business records in custom authentication storage.

## Mobile session persistence

The mobile app explicitly initializes Firebase Authentication with React Native persistence through `@react-native-async-storage/async-storage`. The storage dependency is used by the Firebase Authentication SDK for the authenticated session; application business records are not copied into AsyncStorage.

Expo currently recommends AsyncStorage 2.2.0 for the installed SDK line, and Firebase exposes `getReactNativePersistence()` specifically for this React Native authentication use case. Session behavior must still be exercised on Android and iOS during the release pass.
