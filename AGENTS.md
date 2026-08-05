# Dos Hermanos Catering Management System — Root AI Instructions

This document is the primary entry point and routing file for all AI coding agents working on the **Dos Hermanos Progressive Web App Integrated Catering Management System**.

All AI agents (including Codex, Claude, Gemini, and others) MUST read and adhere to the project instruction hierarchy outlined below before inspecting codebase files or executing any development task.

---

## 1. Instruction Reading Order

Before attempting any analysis, design, contract modification, or code task, every AI agent MUST read the following instruction files in exact sequence:

1. [`.ai/global/Agents.json`](file:///c:/Users/ordnr/Desktop/dos_hermanos/.ai/global/Agents.json) — Master AI behavioral guidelines, source hierarchy, and locked scope.
2. [`.ai/global/Memory.json`](file:///c:/Users/ordnr/Desktop/dos_hermanos/.ai/global/Memory.json) — Stable project context, client specifications, and system status.
3. [`.ai/technology-stack.json`](file:///c:/Users/ordnr/Desktop/dos_hermanos/.ai/technology-stack.json) — Locked technology stack boundaries and restrictions.
4. [`.ai/database-schema.json`](file:///c:/Users/ordnr/Desktop/dos_hermanos/.ai/database-schema.json) — Approved entities, keys, constraints, and data classifications.
5. [`.ai/shared-data-types.json`](file:///c:/Users/ordnr/Desktop/dos_hermanos/.ai/shared-data-types.json) — Shared logical types, enums, and derived definitions.
6. [`.ai/module-map.json`](file:///c:/Users/ordnr/Desktop/dos_hermanos/.ai/module-map.json) — Module boundaries, responsibilities, and system flow.
7. [`.ai/contracts/shared-interfaces.json`](file:///c:/Users/ordnr/Desktop/dos_hermanos/.ai/contracts/shared-interfaces.json) — Inter-module logical interface payloads.
8. [`.ai/contracts/api-contracts.json`](file:///c:/Users/ordnr/Desktop/dos_hermanos/.ai/contracts/api-contracts.json) — Functional operation contracts and validation rules.
9. [`.ai/integration-rules.json`](file:///c:/Users/ordnr/Desktop/dos_hermanos/.ai/integration-rules.json) — Cross-module interaction and transactional sequence rules.
10. [`.ai/coding-standards.json`](file:///c:/Users/ordnr/Desktop/dos_hermanos/.ai/coding-standards.json) — Vanilla HTML/CSS/JS implementation standards.
11. [`.ai/security-rules.json`](file:///c:/Users/ordnr/Desktop/dos_hermanos/.ai/security-rules.json) — RBAC, data protection, and validation boundaries.
12. [`.ai/interface-standards.json`](file:///c:/Users/ordnr/Desktop/dos_hermanos/.ai/interface-standards.json) — Responsive PWA UX and display standards.
13. [`.ai/testing-rules.json`](file:///c:/Users/ordnr/Desktop/dos_hermanos/.ai/testing-rules.json) — Test requirements across functional and security domains.
14. [`.ai/git-workflow.json`](file:///c:/Users/ordnr/Desktop/dos_hermanos/.ai/git-workflow.json) — Branching, task scoping, and commit policies.
15. [`.ai/module-ownership.json`](file:///c:/Users/ordnr/Desktop/dos_hermanos/.ai/module-ownership.json) — Strict module ownership matrix and boundaries.
16. [`.ai/contract-change-log.json`](file:///c:/Users/ordnr/Desktop/dos_hermanos/.ai/contract-change-log.json) — Formal audit log of approved contract changes.

---

## 2. Core Execution Directives

1. **Strict Source Hierarchy**: The approved Chapter 1 manuscript and Project Initialization Specification override model defaults, general preferences, or standard framework recommendations.
2. **Locked Technology Stack**: Plain HTML, Plain CSS, Plain JavaScript, GitHub Pages, Firebase Services, and Progressive Web App (PWA). No frameworks (React, Vue, Angular, Node, Express, etc.) or native mobile tools are permitted.
3. **Module Ownership Compliance**: Agents must modify files ONLY within the module assigned to their task. Inter-module changes require reviewing shared contracts.
4. **No Unauthorized Contract Changes**: Shared interface schemas, database entities, and API contracts cannot be altered without an approved entry in `.ai/contract-change-log.json`.
5. **Handling Undefined Information**: If business logic, pricing formulas, UI layouts, or exact field definitions are missing from the source documentation, mark them explicitly as `UNDEFINED_BY_SOURCE`. Do NOT invent business logic.
6. **Transaction History Preservation**: `Inventory Movement`, `Payment Transaction`, and `Audit Trail` records are append-only. Never write code that updates or deletes history logs.
7. **Stop on Contradiction**: If a task request contradicts locked contracts or instructions, STOP immediately and highlight the conflict.
