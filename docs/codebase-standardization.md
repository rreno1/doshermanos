# Dos Hermanos Codebase Standard

GSU Waste is the source of truth for Dos Hermanos frontend engineering structure, human-readable code, shared UI contracts, and responsive presentation. Dos Hermanos keeps its catering domain and Firebase backend; parity applies to the **engineering shape and reusable frontend standards**, not to the GSU Waste business domain or Supabase backend.

## Canonical source structure

```text
src/
  App.tsx
  core/
    app/
    firebase/
  modules/
    audit/
    auth/
    dashboard/
    operations/
    payments/
    portal/
    reports/
    resources/
    users/
  shared/
    hooks/
    ui/
    utils/
  styles/
```

### Ownership

- `src/App.tsx` composes application routing and top-level workspaces. It should not own feature implementation details.
- `src/core/app` owns cross-application routing, navigation metadata, shell orchestration, error boundaries, and feedback providers.
- `src/core/firebase` is the provider-specific Firebase boundary. Firebase imports should not be scattered through generic shared UI.
- `src/modules/<domain>` owns catering-specific workflows, domain validation, feature services, and pages.
- `src/shared/ui` owns reusable interface primitives. A module must reuse these before creating another button, header, navigation, modal, table, form, feedback, or responsive-control system.
- `src/shared/hooks` and `src/shared/utils` contain generic reusable behavior without catering-domain ownership.
- `src/styles` owns the shared CSS contracts. `index.css` is imports-only and `responsive-contract.css` remains the final cross-cutting style layer.

## Import contract

Use the same architectural aliases as GSU Waste:

- `@core/*`
- `@modules/*`
- `@shared/*`
- `@styles/*`

Aliases communicate ownership. Prefer them over long filesystem-relative imports when crossing architectural layers. Relative imports remain appropriate inside one small module when the relationship is local and obvious.

## Human-readable code contract

1. **Name by intent.** File, component, function, type, and variable names should describe the business or UI responsibility they represent.
2. **Keep control flow flat.** Use early returns and named helpers for guards, authorization, route derivation, validation, and state transitions instead of deeply nested branches.
3. **Centralize contracts.** Navigation metadata, role visibility, shared domain types, and common behavior have one source of truth rather than repeated switch statements or arrays across components.
4. **Keep units focused.** Split large pages when they mix unrelated workflows. A component should be understandable without tracing several unrelated responsibilities.
5. **Do not duplicate infrastructure.** Authentication lifecycle, Firebase access, navigation, shared controls, formatting, errors, feedback, and responsive behavior each have one canonical implementation.
6. **Use comments for reasons.** Comments explain trust boundaries, business constraints, retries, idempotency, compatibility decisions, or other non-obvious intent. Do not narrate syntax.
7. **Keep presentation out of JSX when static.** Reusable visual rules belong in named CSS classes and shared style contracts. Inline style objects are for genuine runtime-calculated values only.
8. **Remove replaced code.** Do not leave an old implementation beside its replacement.

## Presentation ownership contract

Feature modules may own layout and domain-specific presentation, but they must not recreate the visual system already defined by the shared GSU contracts.

- Shared geometry follows the GSU `6px / 8px / 10px` radius system through `--radius-sm`, `--radius-md`, and `--radius-lg`. Fully rounded geometry is reserved for semantic status pills or genuinely circular affordances.
- Shared control geometry follows the GSU `36px / 40px / 42px` compact, toolbar, and form-control sizes.
- Shared semantic colors, surfaces, borders, shadows, focus treatment, and motion come from `src/styles` tokens. Feature CSS must not introduce an independent hard-coded palette or shadow system.
- Management modules compose `ManagementToolbar`, `ManagementTableFrame`, `ManagementSelect`, shared status badges, and shared responsive actions instead of maintaining feature-specific table or toolbar systems.
- Dialog shells, backdrops, viewport sizing, and mobile action footers are owned by the shared modal contract. A feature dialog owns only its domain-specific fields and internal layout.
- The public portal visual language is owned by `src/styles/public-portal-v2.css`; portal module CSS is limited to catering content layout and semantics.
- Replaced feature styles are deleted rather than left as inactive overrides. Compatibility wrappers and orphan styles are treated as debt, not as harmless fallbacks.

The module-level style regression tests enforce this ownership boundary by rejecting oversized custom radii, independent hard-coded feature palettes, custom numeric shadow systems, and retired feature-specific visual subsystems.

## Legacy-path policy

The GSU-style migration boundary is closed. The frontend must not contain compatibility aliases or duplicate legacy trees for `src/app`, `src/features`, or root `src/firebase`.

- New and refactored code targets `core`, `modules`, `shared`, and `styles` only.
- Tests target canonical paths directly so regressions cannot hide behind aliases.
- Source symlinks are not an accepted compatibility mechanism.
- Reintroducing `src/app`, `src/features`, or root `src/firebase` is an architecture regression unless the GSU Waste source of truth itself changes.
- Replaced implementations are deleted rather than retained as fallbacks.

## Review gate

A change is not complete merely because it works or looks correct. Review it against four questions:

1. Is the code in the correct GSU-style architectural layer?
2. Is the implementation readable to another developer without reconstructing hidden conventions?
3. Does it reuse the canonical shared UI/data/navigation contract instead of creating a parallel system?
4. Does it preserve Firebase security, data integrity, tests, and the GSU UI/UX standards?

The regression suite covers architecture, presentation ownership, responsive behavior, semantic controls, and domain behavior. Issue #14 remains the final acceptance gate until codebase, readability, cross-screen responsive behavior, and UI/UX parity are all verified against the current GSU Waste source of truth.
