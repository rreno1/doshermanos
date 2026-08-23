# React Web

## Purpose

Build the web application with React, TypeScript, and Vite using simple components, explicit state, accessible interactions, and feature-owned data access without creating unnecessary frontend complexity.

## Use this skill when

Implementing web routes, components, forms, feature state, Firestore reads, responsive layouts, loading states, or browser-specific behavior.

## Required companion skills

- coding-readability
- architecture
- ui-ux
- frontend-security
- authentication when protected routes are involved
- validation-data-integrity when writes are involved

## Hard rules

1. Keep state local until two or more distant consumers genuinely require shared state.
2. Do not add Redux, Zustand, MobX, XState, or another global state library by default.
3. Do not place feature business logic inside `App.tsx`, root layouts, or route definitions.
4. Keep components focused on one understandable UI responsibility.
5. Avoid mega-components controlled by many boolean props.
6. Prefer small composition over one highly configurable generic component with many modes.
7. Shared components must represent genuinely repeated interface behavior, not speculative reuse.
8. Do not wrap native HTML elements unless the wrapper adds consistent accessibility, repeated design behavior, or real domain value.
9. Firestore reads and writes belong with the feature that owns the data.
10. Do not create one global Firestore service exposing arbitrary collection operations.
11. Avoid duplicate real-time listeners for the same data.
12. Do not use `useEffect` for values that can be derived during render.
13. Do not use effects as a general event-handling mechanism when the event can be handled directly.
14. Every effect must have an understandable external synchronization purpose and correct cleanup where required.
15. Keep forms explicit from input -> validation -> submission -> result.
16. Do not use uncontrolled mutation of shared objects as state.
17. Do not use `any` to bypass TypeScript in application code.
18. Do not use non-null assertions as a substitute for handling loading or missing-data states.
19. Production code must not contain sample records, fake dashboards, debug panels, hard-coded customer data, or development-only bypasses.
20. Lazy-load routes or heavy modules only when it improves actual startup/runtime behavior.
21. Do not introduce generic hook libraries or custom hook layers merely to move code out of components.
22. A hook must own a real reusable React behavior, not simply rename one function call.
23. Keep React keys stable and data-derived. Do not use array indexes for reorderable or mutable business lists.
24. Avoid storing derived values in state when they can be calculated from authoritative state.
25. Preserve accessible native behavior before replacing controls with custom components.
26. Never render unauthorized protected data and then hide it with CSS or conditional controls.
27. Use route parameters as identifiers only, never as authorization proof.
28. Error boundaries may contain rendering failures, but they must not reveal stack traces or protected state to users.

## Component design

A good component should make its main responsibility obvious from its name and props. If a component fetches unrelated data, calculates unrelated business rules, manages several modal workflows, and renders a large page, split by responsibility within the owning feature.

Do not split a cohesive component into many tiny files just to reduce line count.

## State rules

Prefer this order:

1. local component state;
2. lifted state within the feature;
3. small feature context only when several related descendants genuinely need it;
4. global application state only when the state is truly application-wide.

Authentication may have a small application-level context because identity is cross-cutting. Business feature state should remain feature-owned.

## Forms

- Use explicit field names matching business terminology.
- Validate before write attempts for UX, while relying on Firestore Rules for security constraints.
- Preserve user input after validation failures.
- Prevent accidental duplicate submissions while a write is pending.
- Show truthful pending/success/error states.
- Do not optimistically display a high-impact write as committed unless failure can be safely reconciled.

## Responsive rule

Desktop, tablet, and mobile web layouts may change arrangement, density, and navigation presentation, but the workflow, business terminology, permissions, and primary actions must remain consistent.

## Motion rule

Prefer CSS transitions and simple browser-native behavior for ordinary motion. Keep animation local to the owning component and respect reduced-motion preferences.

## Review requirement

A feature should be understandable primarily by reading its own directory. If implementing a simple screen requires tracing through global services, generic hooks, and unrelated providers, simplify the architecture.
