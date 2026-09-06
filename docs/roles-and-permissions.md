# Roles and Permissions

## Customer

Intended responsibilities:

- browse active catering packages;
- create and view their own reservation requests;
- view only their own reservation and permitted payment-receipt information;
- update only profile fields explicitly allowed by security rules.

A customer must never be able to read another customer's private records or change protected role, status, approval, payment, inventory, equipment, or staff-only fields.

## Staff

Intended responsibilities:

- operational reservation handling;
- package maintenance where permitted;
- inventory movements;
- manual payment recording;
- equipment assignment, release, and return processing;
- operational reports required for assigned work.

Staff permissions are not administrator permissions. Each implemented collection defines the specific staff operations it allows, and sensitive operations remain subject to the Firebase rules for an active staff profile.

## Administrator

Intended responsibilities:

- user role and account-status management for other users;
- package management;
- management-level access to operational modules;
- administrator audit-trail review;
- reports and administrative settings that are explicitly implemented.

An administrator cannot change their own protected role or status through the client rules. Changes to another user's role/status require recent Google reauthentication in the web application and an atomically coupled immutable `userAccessEvents` record enforced by Firestore Security Rules.

Administrator access is still defined collection by collection. The project does not use one unrestricted client-side administrator bypass.

## Security rule

Frontend visibility never grants permission. Firestore and Storage Security Rules remain the authorization boundary even when the UI hides or disables an action. App Check and recent-authentication controls add defense in depth but do not replace server-enforced authorization.
