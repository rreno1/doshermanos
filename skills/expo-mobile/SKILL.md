# Expo Mobile

## Purpose

Keep the dedicated mobile application focused, responsive, and simple for customer-facing workflows.

## Use this skill when

Implementing Expo routes, screens, forms, mobile Firebase access, or device-specific behavior.

## Required companion skills

- coding-readability
- architecture
- ui-ux
- frontend-security

## Hard rules

1. Keep the mobile scope narrower than the full web administration system unless requirements change.
2. Prefer customer workflows: authentication, packages, reservations, reservation status, and permitted payment information.
3. Do not duplicate staff/admin functionality on mobile without a clear need.
4. Keep navigation shallow.
5. Avoid hidden gesture-only actions for important tasks.
6. Use platform-appropriate touch targets and input behavior.
7. Do not persist sensitive records locally merely for convenience.
8. Clear protected state after sign-out or account change.
9. Do not add native modules when Expo-supported or standard React Native behavior is sufficient.
10. Do not introduce offline synchronization unless explicitly approved later.
11. Loading and network failure states must leave the user with a clear next action.
12. Keep mobile-specific code separate from shared business concepts when platform behavior differs.

## Navigation preference

A customer should move directly from a relevant list or status screen into the task they need, without navigating through multiple category screens.
