# Dos Hermanos Project Skills

These skills govern implementation before and during application-code generation. They are intentionally modular so a task loads only the rules it needs instead of one monolithic instruction file.

## Global precedence

When rules appear to compete, apply this order:

1. security and prevention of unauthorized data exposure;
2. data integrity and correctness;
3. approved project scope and technology baseline;
4. clear, accessible user workflow;
5. maintainability and human-readable code;
6. scalability and predictable performance;
7. implementation convenience.

No convenience rule may weaken a security or data-integrity rule.

## Routing

- Project scope, stack, dependencies, and platform decisions: `project-foundation/SKILL.md`
- Human-readable implementation style and abstraction limits: `coding-readability/SKILL.md`
- Feature boundaries, imports, and monolith prevention: `architecture/SKILL.md`
- Direct workflows, responsive behavior, accessibility, and motion: `ui-ux/SKILL.md`
- Prevention of client-side data leakage: `frontend-security/SKILL.md`
- Firestore authorization and security rules: `firestore-security/SKILL.md`
- Firestore collections, documents, snapshots, and query-oriented modeling: `firestore-data-design/SKILL.md`
- Firebase Authentication and session transitions: `authentication/SKILL.md`
- React + TypeScript + Vite web implementation: `react-web/SKILL.md`
- Expo React Native customer mobile implementation: `expo-mobile/SKILL.md`
- Efficient reads, pagination, bounded growth, listeners, and performance: `scalability-performance/SKILL.md`
- Validation, state transitions, money, duplicate prevention, and consistency: `validation-data-integrity/SKILL.md`
- Security, behavior, regression, accessibility, and release testing: `testing-quality/SKILL.md`
- Git changes, commits, branch hygiene, and secret prevention: `git-workflow/SKILL.md`

## Task loading matrix

### Creating a normal web feature

Load at minimum:

- project-foundation
- coding-readability
- architecture
- ui-ux
- react-web

Also load frontend-security whenever the screen handles data. Load authentication and firestore-security for protected data. Load validation-data-integrity for writes.

### Creating a mobile feature

Load at minimum:

- project-foundation
- coding-readability
- architecture
- ui-ux
- expo-mobile

Add the same security, authentication, Firestore, and validation skills when data access requires them.

### Designing Firestore

Load:

- project-foundation
- firestore-data-design
- firestore-security
- frontend-security
- scalability-performance
- validation-data-integrity

### Changing authentication or roles

Load:

- authentication
- firestore-security
- frontend-security
- validation-data-integrity
- testing-quality

### Preparing a release

Load:

- testing-quality
- git-workflow
- frontend-security
- firestore-security when rules changed
- project-foundation for dependency/scope verification

## Execution protocol

Before generating code:

1. identify the feature owner;
2. load the relevant skills;
3. identify the user roles involved;
4. identify the minimum data the UI needs;
5. define or verify the Firestore access path and security boundary;
6. identify high-impact writes and allowed state transitions;
7. verify that the task does not require an unapproved dependency or backend capability.

During implementation:

1. keep code inside the owning feature;
2. keep data reads narrow and authorized;
3. keep business rules explicit;
4. avoid speculative abstractions;
5. implement loading, error, empty, denied, and responsive states;
6. preserve accessibility and reduced-motion behavior;
7. add the smallest useful tests for security and business behavior.

Before declaring completion:

1. review the diff against the loaded skills;
2. check that no protected data leaks to unauthorized clients;
3. verify no secrets, sample production data, or debug bypasses were added;
4. verify typecheck/build/tests as appropriate;
5. verify Firestore Rules tests when rules changed;
6. remove temporary files and abandoned code.

## Mandatory stop conditions

Stop implementation and raise the issue instead of improvising when:

- the requested feature cannot be secured with the approved client-only Firebase architecture;
- a requirement needs a trusted secret or privileged server action while Cloud Functions remain excluded;
- security rules would need to be weakened to make the UI work;
- the requested data model would expose fields to roles that must not see them;
- the requested feature conflicts with the locked project scope;
- a new dependency or integration has no clear requirement.

## Standard

Prefer explicit, boring, readable code that humans can understand and audit. Keep the user journey short. Keep Firestore queries bounded. Keep authorization server-enforced through Firestore Security Rules. Never fetch protected data merely to hide it in the frontend.
