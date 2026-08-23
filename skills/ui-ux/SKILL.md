# UI and UX

## Purpose

Make the system immediately understandable and minimize navigation effort for customers, staff, and administrators while keeping the interface modern, polished, and calm.

## Use this skill when

Designing screens, navigation, forms, dashboards, tables, actions, empty states, loading states, responsive behavior, or mobile flows.

## Hard rules

1. Common tasks must require as few meaningful steps as practical.
2. Do not add a screen when the same decision can be completed clearly on the current screen.
3. Primary actions must be visible without hunting through menus.
4. Use familiar business language instead of technical system terminology.
5. Related information and actions should stay together.
6. Avoid nested menus, deep route trees, modal chains, and unnecessary confirmation screens.
7. Use confirmation only for destructive, irreversible, financially important, or high-impact actions.
8. A dashboard should surface items that need attention, not just decorative metrics.
9. Forms should ask only for information required at that step.
10. Preserve entered form data when validation fails.
11. Validation messages must explain what the user needs to fix.
12. Status labels must be consistent across web and mobile.
13. Loading, success, empty, denied, and error states must be clear and visually polished.
14. Responsive layouts must preserve the same task flow across desktop, tablet, and mobile.
15. Accessibility is part of usability: keyboard support where applicable, visible focus, semantic controls, readable contrast, useful labels, and adequate touch targets.
16. Use a modern visual language with clean spacing, clear hierarchy, restrained surfaces, and minimal clutter.
17. Avoid excessive cards, borders, floating panels, decorative badges, and visual containers when normal layout and spacing communicate structure better.
18. Use subtle motion for state changes, page transitions, expandable sections, hover or press feedback, loading, success feedback, and other moments where motion improves understanding.
19. Motion must be short, purposeful, and non-blocking. Never make users wait for animation before completing a common task.
20. Do not animate everything. Static content should remain static unless motion communicates change, location, hierarchy, or feedback.
21. Respect `prefers-reduced-motion` on the web and equivalent reduced-motion accessibility settings on mobile.
22. Do not let visual effects reduce readability, contrast, performance, or accessibility.
23. Use skeletons, progressive loading, or compact loading indicators only where they make waiting easier to understand.
24. Empty states should explain what is missing and provide the next useful action when one exists.
25. Interactions should feel responsive immediately: buttons, tabs, rows, toggles, and navigation must provide clear hover, focus, pressed, selected, disabled, and loading states.

## Modern UI direction

Modern does not mean visually busy. Prefer clarity, spacing, typography, responsive feedback, subtle depth, and well-timed motion over decoration.

Use animation as interaction feedback rather than entertainment. A transition should help the user understand what changed or where content moved.

Do not introduce extra navigation simply to make the interface look like a large enterprise dashboard. Keep the shortest clear path to the task.

## Workflow preference

Prefer direct flows such as list -> open record -> act.

Avoid flows that force users through category pages, action menus, status pages, and success pages when those screens do not add a real decision.

## Review questions

For every extra click, page, modal, or field, ask what user decision it enables. If there is no clear answer, remove it.

For every animation or visual effect, ask what change, feedback, or hierarchy it communicates. If there is no clear answer, remove it.
