# Git Workflow

## Purpose

Keep repository history understandable and prevent unrelated changes from being mixed into implementation work.

## Use this skill when

Creating branches, commits, refactors, or repository cleanup.

## Hard rules

1. Keep commits focused on one coherent change.
2. Do not mix unrelated refactoring with feature work.
3. Do not commit secrets, service-account files, private credentials, local environment files, or production data exports.
4. Review staged changes before commit.
5. Do not commit generated build output unless deployment strategy explicitly requires tracked artifacts.
6. Do not keep temporary debug files, scratch data, or abandoned experiments in the repository.
7. Prefer clear commit messages that describe what changed.
8. Preserve the agreed directory boundaries unless an architectural change is intentional.
9. Do not rename or reorganize large areas during a small bug fix.
10. Before merging security-rule changes, verify related tests and access behavior.
11. Delete temporary branches after their work is safely merged when branch cleanup is part of the workflow.
12. Never rewrite shared history casually.

## Change discipline

A small task should produce a small diff. If the diff expands far beyond the requirement, stop and reassess the implementation.
