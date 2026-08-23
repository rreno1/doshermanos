# UI and UX

## Purpose

Make the system immediately understandable, modern, polished, accessible, and fast to operate. Users should reach common tasks with the minimum number of meaningful decisions and without learning the internal structure of the software.

## Use this skill when

Designing screens, navigation, forms, dashboards, tables, lists, actions, loading states, empty states, errors, responsive behavior, animation, or mobile flows.

## Core design standard

Modern does not mean visually busy. Prefer clear hierarchy, strong spacing, readable typography, restrained surfaces, responsive feedback, and purposeful motion over decoration.

## Hard rules

1. Common tasks must require as few meaningful steps as practical.
2. Do not add a screen when the same decision can be completed clearly on the current screen.
3. Primary actions must be visible without hunting through menus.
4. Use familiar catering and business language instead of internal technical terminology.
5. Related information and actions must stay together.
6. Avoid nested menus, deep route trees, modal chains, action menus inside action menus, and unnecessary success pages.
7. Use confirmation only for destructive, irreversible, financially important, or high-impact actions.
8. A dashboard must surface items that need attention, not merely decorative metrics.
9. Forms must ask only for information required at the current step.
10. Preserve entered form data when validation fails.
11. Validation messages must state what is wrong and what the user needs to fix.
12. Status labels, colors, and wording must be consistent across web and mobile.
13. Loading, success, empty, denied, offline/network, and error states must be explicit and understandable.
14. Responsive layouts may change arrangement but must preserve workflow, terminology, permissions, and action priority.
15. Accessibility is mandatory: semantic controls, visible focus, keyboard support where applicable, useful labels, readable contrast, sufficient touch targets, and reduced-motion support.
16. Do not use color alone to communicate status or errors.
17. Do not hide essential actions behind hover-only behavior or gesture-only interaction.
18. Do not use placeholder text as the only field label.
19. Avoid excessive cards, borders, badges, panels, dividers, and visual containers when spacing and typography already communicate structure.
20. Avoid dashboard layouts where every small value becomes a separate card.
21. Tables must remain readable on smaller screens through responsive alternatives, horizontal containment, or detail views; do not simply shrink text until it is unreadable.
22. Important destructive actions must be visually separated from routine actions.
23. Disabled actions must communicate why they are unavailable when the reason is not obvious.
24. Empty states should explain what is missing and show the next useful action when one exists.
25. Long forms should be grouped by meaningful sections, not split across many pages without necessity.
26. Do not require users to re-enter data that the system already knows and is authorized to use.
27. Keep labels concise and direct. Avoid vague buttons such as `Submit`, `Proceed`, or `Action` when `Confirm reservation`, `Record payment`, or `Save changes` is clearer.

## Motion rules

1. Motion must communicate feedback, change, hierarchy, or location.
2. Do not animate everything.
3. Ordinary micro-interactions should generally feel immediate and brief; prefer short transitions rather than theatrical sequences.
4. Never make users wait for an animation before completing a common action.
5. Loading animation must not disguise indefinite waiting. Show meaningful progress or a clear retry state when appropriate.
6. Respect `prefers-reduced-motion` on web and equivalent platform settings on mobile.
7. Do not use motion that causes layout jumping, accidental taps, or loss of focus.
8. Keep animation logic local and simple unless a repeated shared primitive genuinely needs it.
9. Do not add a motion library for basic hover, press, fade, height, or opacity transitions when platform-native behavior is sufficient.

## Interaction states

Buttons, tabs, rows, inputs, toggles, and navigation elements must define relevant states: default, hover where applicable, focus, pressed, selected, disabled, loading, success, and error.

Do not leave users uncertain whether an action was accepted. Provide immediate state feedback while preserving truthful completion status.

## Navigation standard

Prefer direct flows such as:

```text
Reservations -> Open reservation -> Review -> Approve or reject
```

Avoid artificial flows such as:

```text
Dashboard -> Operations -> Reservation Management -> Pending -> Details -> Actions -> Status -> Confirmation -> Success Page
```

Each extra navigation step must represent a real user decision or a necessary security boundary.

## Responsive standard

- Desktop: use available space to show context and actions together without clutter.
- Tablet: preserve primary actions and readable details without forcing desktop density.
- Mobile web: stack content logically and keep primary actions reachable.
- Native mobile: prioritize touch, shallow navigation, and customer tasks.

## Review questions

For every extra click, page, modal, field, visual container, or animation, ask what user decision or understanding it improves. If there is no clear answer, remove it.
