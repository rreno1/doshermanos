# Roles and Permissions

## Customer

Intended responsibilities:

- browse permitted catering packages;
- create and view their own reservation requests once the reservation feature is implemented;
- view only their own reservation and permitted payment information;
- update only profile fields explicitly allowed by security rules.

A customer must never be able to read another customer's private records or change protected role, status, approval, payment, inventory, or staff-only fields.

## Staff

Intended responsibilities:

- operational reservation handling;
- package maintenance where permitted;
- inventory movements;
- manual payment recording;
- equipment release and return processing;
- operational reports required for assigned work.

Staff permissions are not administrator permissions. Each implemented collection must define the specific staff operations it allows.

## Administrator

Intended responsibilities:

- user role and account-status management;
- package management;
- management-level access to operational modules;
- reports and administrative settings that are explicitly implemented.

Administrator access is still defined collection by collection. The project does not use one unrestricted client-side administrator bypass.

## Security rule

Frontend visibility never grants permission. Firestore Security Rules remain the authorization boundary even when the UI hides or disables an action.
