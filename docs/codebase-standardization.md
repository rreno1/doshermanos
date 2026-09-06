# Dos Hermanos Codebase and UI/UX Standard

This document defines the **Dos Hermanos Standard**: the canonical frontend architecture, human-readable code conventions, shared UI contracts, responsive behavior, presentation rules, and security expectations for the Dos Hermanos Catering System.

During the standardization project, an external production-style implementation was used as the visual and interaction benchmark. That provenance does not make the benchmark the owner or name of this standard. From this point forward, the implementation, tests, documentation, and review gates are named for **Dos Hermanos**. Dos Hermanos keeps its catering domain and Firebase backend.

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

- `src/App.tsx` composes application routing and top-level workspaces. It does not own feature implementation details.
- `src/core/app` owns cross-application routing, navigation metadata, shell orchestration, error boundaries, and feedback providers.
- `src/core/firebase` is the provider-specific Firebase boundary. Firebase imports are not scattered through generic shared UI.
- `src/modules/<domain>` owns catering-specific workflows, domain validation, feature services, and pages.
- `src/shared/ui` owns reusable interface primitives. A module reuses these before creating another button, header, navigation, modal, table, form, feedback, or responsive-control system.
- `src/shared/hooks` and `src/shared/utils` contain generic reusable behavior without catering-domain ownership.
- `src/styles` owns the shared presentation contracts. `index.css` is imports-only and `responsive-contract.css` remains the final cross-cutting style layer.

## Dos Hermanos architectural aliases

Use these aliases when crossing architectural layers:

- `@core/*`
- `@modules/*`
- `@shared/*`
- `@styles/*`

Aliases communicate ownership. Relative imports remain appropriate inside one small module when the relationship is local and obvious.

## Human-readable code contract

1. **Name by intent.** File, component, function, type, and variable names describe the business or UI responsibility they represent.
2. **Keep control flow flat.** Prefer early returns and named helpers for guards, authorization, route derivation, validation, and state transitions instead of deeply nested branches or ternaries.
3. **Centralize contracts.** Navigation metadata, role visibility, shared domain types, and common behavior have one source of truth.
4. **Keep units focused.** Split large pages when they mix unrelated workflows. A component should be understandable without tracing several unrelated responsibilities.
5. **Do not duplicate infrastructure.** Authentication lifecycle, Firebase access, navigation, shared controls, formatting, errors, feedback, and responsive behavior each have one canonical implementation.
6. **Use comments for reasons.** Comments explain trust boundaries, business constraints, retries, idempotency, compatibility decisions, or other non-obvious intent. Do not narrate syntax.
7. **Keep static presentation out of JSX.** Reusable visual rules belong in named CSS classes and shared style contracts. Inline style objects are reserved for genuine runtime-calculated values.
8. **Remove replaced code.** Do not leave an old implementation beside its replacement.

## Dos Hermanos presentation contract

Feature modules may own domain-specific layout and content, but they must not recreate the visual system already defined by the Dos Hermanos shared contracts.

### Geometry and controls

- Shared radii are `6px / 8px / 10px` through `--radius-sm`, `--radius-md`, and `--radius-lg`.
- Fully rounded geometry is reserved for semantic status pills or genuinely circular affordances.
- Compact controls are `36px`.
- Toolbar controls are `40px`.
- Single-line form controls are `42px`.
- The desktop management sidebar is `248px` wide.
- Typography uses the canonical Poppins-based font system and the shared type tokens.

### Surfaces and interaction

- Shared colors, surfaces, borders, shadows, focus treatment, and motion come from `src/styles` tokens.
- Feature CSS must not introduce an independent palette, shadow system, radius system, or duplicate visual language.
- Management modules compose the shared toolbar, tabs, select, table-frame, status, feedback, and responsive-action primitives.
- Dialog shells, backdrops, viewport sizing, and mobile action footers are owned by the shared modal and form contracts.
- The public portal visual language is owned by `src/styles/public-portal-v2.css`; portal module CSS is limited to catering content layout and semantics.
- Replaced feature styles are deleted rather than retained as inactive overrides.

### Responsive behavior

- Desktop uses the 248px sidebar and keeps relevant filters, context, and actions visible together.
- Tablet preserves readable content and primary actions without forcing desktop density.
- Mobile navigation is body-portalled, focus-managed, dismissible with Escape/backdrop, scroll-locked while open, and returns focus after close.
- Tables preserve semantic markup and prioritize primary, status, and action columns as space narrows.
- Narrow-phone table headers may be visually hidden while remaining available to assistive technology.
- Forms collapse to one logical column where required; important dialog actions stay reachable with a sticky mobile action region.
- Reduced-motion preferences are respected.

### Public portal invariants

The Dos Hermanos public portal owns these baseline details:

- portal ink `#153a31`
- portal green `#1f6b57`
- page background `#f4f7f5`
- hero spacing `clamp(56px, 4.5vw, 68px)`
- 76px sticky public header
- 3px green top border
- restrained 18px backdrop blur where supported
- 12px public content-card radius where the portal design calls for it
- 8px public control radius

## Security contract

The Dos Hermanos Standard treats frontend security, Firebase authorization, browser policy, and release controls as one system rather than separate afterthoughts.

- Firebase Security Rules are the authoritative authorization boundary; hidden controls and route guards never substitute for rules.
- Authenticated sessions accept only non-anonymous, email-verified Google identities.
- Staff and administrator browser sessions use session-scoped persistence; customers retain local persistence.
- The existing inactivity timeout remains active, and sensitive access/payment operations use recent-authentication step-up.
- Firebase App Check with score-based reCAPTCHA Enterprise is supported for staging/production and must be rolled out through metrics before enforcement.
- Resource image uploads are MIME/size constrained and bound to existing Firestore resource records.
- Hosting applies strict CSP, clickjacking protection, cross-origin isolation-compatible headers, HSTS, restrictive browser permissions, and safe cache policy.
- CI includes Firestore rules tests, Storage policy checks, Hosting security checks, environment separation, production dependency auditing, behavior tests, and readability/architecture guards.
- Dependabot monitors dependency and GitHub Actions updates.
- No service-account key, private key, App Check debug token, privileged credential, or other secret belongs in the repository.

Operational details and the App Check rollout procedure are defined in `docs/security-hardening.md`.

## Legacy-path policy

The Dos Hermanos migration boundary is closed. The frontend must not contain compatibility aliases or duplicate legacy trees for `src/app`, `src/features`, or root `src/firebase`.

- New and refactored code targets `core`, `modules`, `shared`, and `styles` only.
- Tests target canonical paths directly so regressions cannot hide behind aliases.
- Source symlinks are not an accepted compatibility mechanism.
- Reintroducing `src/app`, `src/features`, or root `src/firebase` is an architecture regression.
- Replaced implementations are deleted rather than retained as fallbacks.

## Firebase boundary

The Dos Hermanos Standard preserves the approved backend:

- Firebase Authentication
- Cloud Firestore
- Firebase Storage where required by approved workflows
- Firebase Hosting
- Firebase App Check as an additional deployment attestation layer when configured/enforced

Frontend standardization must never weaken Firestore or Storage Security Rules, introduce privileged client credentials, or substitute another backend merely to imitate a frontend benchmark.

## Review gate

A change is not complete merely because it works or looks correct. Review it against these questions:

1. Is the code in the correct Dos Hermanos architectural layer?
2. Is the implementation readable to another developer without reconstructing hidden conventions?
3. Does it reuse the canonical Dos Hermanos shared UI/data/navigation contract instead of creating a parallel system?
4. Does it preserve Firebase authorization, security, and data integrity?
5. Does it preserve the exact Dos Hermanos geometry, interaction, responsive, accessibility, and public-portal standards?
6. Has replaced or competing presentation code been removed rather than overridden indefinitely?
7. Does the change keep identity, session, App Check, Hosting, Storage, and dependency-security guardrails intact?

The regression suite enforces the **Dos Hermanos Standard** for architecture, presentation ownership, responsive behavior, semantic controls, security controls, and domain behavior. Issue #14 remains the acceptance gate for this standardization project until every applicable screen has been independently verified against the benchmark and the exact final head passes CI.
