# React Web

## Purpose

Build the web application with React, TypeScript, and Vite without creating unnecessary frontend complexity.

## Use this skill when

Implementing web routes, components, forms, feature state, Firestore reads, or responsive behavior.

## Required companion skills

- coding-readability
- architecture
- ui-ux
- frontend-security

## Hard rules

1. Keep state local unless multiple distant components genuinely need the same state.
2. Do not add a global state library by default.
3. Do not place feature business logic inside `App.tsx` or route definitions.
4. Keep components focused on one understandable UI responsibility.
5. Avoid components with excessive boolean props that create many hidden variants.
6. Prefer composition over generic configurable mega-components.
7. Shared components should represent genuinely repeated interface behavior.
8. Do not create wrappers around basic HTML elements unless the wrapper adds consistent accessibility or repeated design behavior.
9. Firestore reads belong with the feature that owns the data.
10. Avoid duplicate real-time listeners for the same data.
11. Do not use effects for calculations that can be derived directly during render.
12. Keep forms explicit and easy to trace from input to validation to submission.
13. Lazy-load only when it materially improves the application, not as architecture decoration.
14. Production code must not contain development-only data, debug panels, or sample records.

## Responsive rule

Desktop, tablet, and mobile web layouts may change presentation, but the business workflow and terminology should remain consistent.
