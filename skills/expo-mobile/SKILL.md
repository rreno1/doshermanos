# Expo Mobile

## Purpose

Keep the dedicated Expo React Native application focused, responsive, accessible, secure, and simple for customer-facing workflows.

## Use this skill when

Implementing Expo routes, screens, forms, mobile Firebase access, navigation, animations, or device-specific behavior.

## Required companion skills

- coding-readability
- architecture
- ui-ux
- frontend-security
- authentication when protected screens are involved
- validation-data-integrity when writes are involved

## Scope boundary

The mobile application is intentionally narrower than the web administration application unless project scope explicitly changes.

Primary mobile responsibilities:

- authentication;
- package browsing;
- reservation creation and permitted updates;
- reservation status;
- permitted payment information.

## Hard rules

1. Do not duplicate staff/admin-heavy web functionality on mobile without an explicit requirement.
2. Keep navigation shallow and task-oriented.
3. Important actions must never depend on hidden gestures.
4. Use platform-appropriate touch targets, input controls, keyboard behavior, safe areas, and screen-reader labels.
5. Do not persist sensitive business records locally merely for convenience.
6. Do not place protected data in AsyncStorage, custom files, logs, deep-link parameters, or analytics payloads without explicit review.
7. Clear protected feature state on sign-out, account change, loss of authorization, or suspension.
8. Do not display previous-user protected content while a new session resolves.
9. Do not add native modules when Expo-supported or standard React Native behavior is sufficient.
10. Do not introduce offline synchronization unless explicitly approved later.
11. Do not silently queue high-impact writes for later replay when offline behavior is not part of scope.
12. Network failure states must provide a clear retry or recovery action.
13. Mobile-specific behavior belongs in mobile code. Do not force a web abstraction onto native UI merely for code symmetry.
14. Do not use web-only interaction assumptions such as hover for essential actions.
15. Avoid deep stacks where the user must repeatedly press Back to return to a primary task.
16. Do not create a custom navigation framework over Expo Router unless an actual limitation requires it.
17. Avoid permanent local caches of broad Firestore data sets.
18. Use real-time listeners only where live updates materially improve the customer experience.
19. Do not request device permissions unrelated to an approved feature.
20. Do not collect device identifiers, contacts, location, photos, notifications, or other platform data unless the feature explicitly requires it and the permission flow is reviewed.
21. Keep animation lightweight, purposeful, and respectful of reduced-motion settings.
22. Do not block navigation or submission behind decorative animation.
23. Avoid excessive dependencies that increase native build complexity without solving a required problem.

## Navigation preference

A customer should move directly from a relevant list or status screen into the task they need. Avoid category screens whose only purpose is to lead to another category screen.

## Form behavior

- Keep labels visible and concise.
- Preserve entered values after recoverable validation errors.
- Handle keyboard overlap and focus movement deliberately.
- Prevent duplicate taps while a write is pending.
- Provide clear success and error feedback without unnecessary success screens.

## Authentication transition rule

When identity changes, protected screens must return to a safe unresolved or signed-out state before any new account data is shown.

## Mobile performance rule

Lists that can grow must use appropriate list virtualization and bounded Firestore queries. Do not render large unbounded arrays in a scroll view.

## Review requirement

A customer should be able to complete the main mobile workflows without understanding the system's module structure, without deep navigation, and without any protected data being stored or exposed unnecessarily on the device.
