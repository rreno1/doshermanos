# Architecture

## Purpose

Keep the codebase modular by business feature without turning a small catering system into a layered enterprise framework or a set of oversized monolithic files.

## Use this skill when

Creating files, moving logic, adding features, defining imports, deciding shared boundaries, or reviewing whether a component or service belongs in a feature.

## Primary rule

Organize by business feature first. Shared code exists only when it is genuinely shared by multiple features and moving it improves clarity.

## Approved feature boundaries

### Web

- auth
- packages
- reservations
- inventory
- payments
- equipment
- reports

### Mobile

- auth
- packages
- reservations
- payments

These boundaries may evolve only when a real requirement creates a new responsibility.

## Hard rules

1. A feature owns its own UI, types, validation, Firestore operations, and feature-specific interaction logic when practical.
2. Do not create a global service that contains unrelated Firestore operations.
3. Do not create controller -> service -> repository -> adapter chains for direct Firebase client operations.
4. Keep `App`, root layouts, and route definitions focused on composition and navigation, not business logic.
5. Keep Firebase initialization separate from feature-specific data access.
6. Move code into global `components`, `utils`, or other shared folders only after at least two features genuinely need the same behavior.
7. Do not create empty architectural layers in anticipation of future growth.
8. Cross-feature imports must be explicit and minimal.
9. Circular dependencies are forbidden.
10. Prefer one obvious source of truth for each business calculation, validation rule, and state-transition rule.
11. Do not scatter one feature across global `components`, `services`, `hooks`, `repositories`, and `utils` directories when those files are used only by that feature.
12. Shared visual primitives may live in shared components, but business-specific screens and components belong to their owning feature.
13. Do not introduce a separate animation subsystem for ordinary interface motion.
14. Split a file when it contains clearly separate responsibilities, not because it crosses an arbitrary line-count threshold.
15. Do not hide data-access security assumptions behind generic CRUD helpers.
16. Do not create one universal Firestore client with arbitrary collection names or unrestricted generic reads/writes.
17. Do not create a generic `BaseService`, `CrudService`, `DataManager`, or repository that allows features to bypass domain-specific validation.
18. A feature may call a shared primitive, but shared primitives must not know about feature-specific business states.
19. Do not create duplicated domain types with slightly different names across web features.
20. Do not create a shared package between web and mobile until actual duplicated business logic justifies the maintenance cost.

## Preferred feature shape

A feature may contain only the files it actually needs, for example:

```text
reservations/
├── components/
├── pages/
├── reservation.service.ts
├── reservation.types.ts
└── reservation.validation.ts
```

A simpler feature may legitimately contain only one or two files. Do not create every folder from the example by default.

## Dependency direction

Prefer this direction:

```text
page/screen
  -> feature component
  -> feature validation/data operation
  -> Firebase SDK
```

Shared UI primitives and small shared utilities may be called from features. Avoid reverse dependencies where shared infrastructure imports a business feature.

## Monolith prevention

Refactor before a file becomes a dumping ground for unrelated responsibilities. Strong warning signs include:

- one file handles multiple business modules;
- one service contains many unrelated collections;
- a component handles fetching, business validation, navigation, rendering, and unrelated modal workflows at once;
- a root provider owns most application state;
- unrelated features must edit the same file for ordinary changes.

## Over-fragmentation prevention

Do not respond to monolith risk by creating dozens of tiny files. A small cohesive file is better than a five-file call chain that only wraps one operation.

## Architecture review questions

Before adding a file or layer, ask:

- Which feature owns this responsibility?
- Is this genuinely shared?
- Will this make the call path shorter or longer?
- Can this be implemented safely without a new abstraction?
- Does the new structure make security and data ownership easier to audit?

If ownership is unclear, do not add the abstraction yet.
