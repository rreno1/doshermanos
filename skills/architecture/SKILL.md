# Architecture

## Purpose

Keep the codebase modular without turning a small catering system into a layered enterprise framework.

## Use this skill when

Creating files, moving logic, adding features, or deciding where code belongs.

## Primary rule

Organize by business feature first. Shared code exists only when it is genuinely shared.

## Web feature boundaries

- auth
- packages
- reservations
- inventory
- payments
- equipment
- reports

## Mobile feature boundaries

- auth
- packages
- reservations
- payments

## Hard rules

1. A feature owns its own UI, types, validation, and Firestore operations when practical.
2. Do not create a global service that contains unrelated Firestore operations.
3. Do not create controller -> service -> repository -> adapter chains for simple Firebase operations.
4. Keep `App` and routing files focused on composition and navigation, not business logic.
5. Keep Firebase initialization separate from feature-specific database operations.
6. Move code to `components`, `utils`, or other shared locations only when multiple features truly need it.
7. Do not create empty architectural layers in anticipation of future growth.
8. Cross-feature access should be explicit and minimal.
9. Circular dependencies are not allowed.
10. Prefer one obvious source of truth for each business calculation or state rule.

## File creation rule

Do not create files merely because a template normally contains them. Create a file when it has a real responsibility.

## Smell test

Refactor if one file becomes a dumping ground for unrelated features, but do not split a readable file into many tiny files just to reduce line count.
