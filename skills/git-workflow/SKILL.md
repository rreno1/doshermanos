# Git Workflow

## Purpose

Keep repository history understandable, auditable, and safe while preventing unrelated changes, temporary files, secrets, and architectural drift from being mixed into implementation work.

## Use this skill when

Creating branches, commits, refactors, merges, repository cleanup, or preparing implementation work for review.

## Hard rules

1. Keep each commit focused on one coherent change.
2. Do not mix unrelated refactoring with feature work.
3. Do not commit secrets, service-account files, private credentials, local environment files containing secrets, authentication tokens, or production data exports.
4. Review the actual diff before committing.
5. Do not commit generated build output unless the deployment strategy explicitly requires tracked artifacts.
6. Do not keep temporary debug files, scratch data, abandoned experiments, refinement markers, or local notes in the repository after the task is complete.
7. Use commit messages that state what changed, not vague messages such as `update`, `fix stuff`, or `changes`.
8. Preserve agreed feature and directory boundaries unless the task intentionally changes architecture.
9. Do not rename or reorganize large areas during a small bug fix.
10. Before merging Firestore Security Rules changes, verify the related rule tests and expected access behavior.
11. Delete temporary branches after their work is safely merged when branch cleanup is part of the workflow.
12. Never rewrite shared history casually.
13. Do not force-push a shared branch unless the task explicitly requires history repair and the impact is understood.
14. Do not commit commented-out old implementations as backup. Git already stores history.
15. Do not commit real customer data in fixtures, screenshots, documentation examples, or test snapshots.
16. Do not combine dependency upgrades with unrelated feature behavior unless the dependency change is required for that feature.
17. Keep lockfile changes tied to intentional dependency changes.
18. Do not modify files outside the task scope without a clear reason.
19. If a task reveals a larger architectural issue, document or separate it rather than silently expanding the diff.
20. A security-critical change should be reviewable without unrelated formatting churn.

## Branch discipline

For non-trivial work, prefer a short-lived descriptive branch when the workflow supports review. Keep the branch scoped to one feature, fix, or architectural change.

Do not create branches merely to satisfy ceremony when changes are intentionally being made directly on the approved branch.

## Commit message style

Prefer concise conventional messages such as:

- `feat: add reservation availability view`
- `fix: block cross-customer reservation reads`
- `docs: refine firestore security skill`
- `refactor: split reservation form responsibilities`
- `test: add reservation ownership rule coverage`

The message should match the actual diff.

## Change discipline

A small task should usually produce a small diff. If a supposedly small task modifies many modules, dependencies, or architectural layers, stop and reassess before committing.

## Security review before commit

Check the diff for:

- secrets and credentials;
- customer or production data;
- overly broad Firestore rules;
- debug logs containing protected information;
- temporary authentication bypasses;
- environment files that should remain local;
- accidental generated output.

## Completion rule

Do not leave repository scaffolding or temporary markers created only for an in-progress task. A completed commit should represent a coherent repository state that another developer can pull and understand.
