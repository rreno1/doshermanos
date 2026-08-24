# Project Foundation

## Purpose

Keep Dos Hermanos small, understandable, secure, scalable, and aligned with the approved project scope. This skill controls high-level technology and scope decisions before implementation details are considered.

## Use this skill when

Making decisions about stack, dependencies, integrations, shared infrastructure, deployment, platform boundaries, or whether a proposed feature belongs in the current system.

## Locked baseline

- Web: React + TypeScript + Vite.
- Mobile: Expo React Native.
- Authentication: Firebase Authentication.
- Database: Cloud Firestore.
- Hosting: Firebase Hosting for the web application.
- Current live payment scope: manual cash payment recording only.
- A hosted payment-link card may be present in customer UI as a deliberately disabled readiness surface.
- No live online payment provider, payment URL, checkout redirect, card form, webhook, provider SDK, or provider secret is configured yet.
- PayMongo is no longer part of the approved payment direction.
- Cloud Functions are intentionally excluded for now.
- Web and mobile use the same Firebase project and the same authoritative business data.

## Non-negotiable principles

1. Security and data protection outrank implementation convenience.
2. Correctness outranks brevity.
3. Simplicity outranks speculative architecture.
4. Scalability means bounded data access and maintainable growth, not adding enterprise infrastructure prematurely.
5. The client is never a trusted security boundary.
6. If a requirement cannot be implemented safely with the current approved stack, do not fake the security property. Stop and document the limitation before adding a trusted backend or changing scope.

## Hard rules

1. Do not add frameworks, SDKs, state libraries, backend layers, hosted services, analytics products, or integrations unless a current requirement clearly needs them.
2. Every new dependency must have one named problem it solves. If the problem can be solved clearly with the current stack, do not add the dependency.
3. Prefer Firebase and platform-native capabilities before adding third-party infrastructure.
4. Do not add PayMongo, a live payment-link provider, Cloud Functions, AI features, offline synchronization, supplier automation, payroll, HR, full accounting, GPS, RFID, or unrelated modules unless explicitly approved later.
5. A disabled payment-link readiness card must not contain a real checkout URL, provider token, card-number field, CVC field, expiry field, hidden integration call, or fake success path.
6. When live hosted payments are approved later, provider selection is a security and architecture change. Review trusted-backend requirements, webhook verification, idempotency, payment-status authority, secrets, and customer-return behavior before enabling checkout.
7. Keep the web application responsible for staff/admin-heavy workflows unless a mobile requirement explicitly needs the same capability.
8. Keep the mobile application focused on customer workflows: authentication, package browsing, reservations, reservation status, and permitted payment information.
9. Do not create a shared package or internal framework merely because web and mobile have similar concepts. Share only when real duplication justifies it and the result remains easier to understand.
10. Do not create infrastructure for hypothetical multi-tenant, multi-region, microservice, event-bus, or enterprise scenarios.
11. Do not expose Firebase privileged credentials or administrative capabilities to either client.
12. Do not weaken Firestore Security Rules to make frontend implementation easier.
13. Do not use production data as development fixtures or sample content.
14. Do not introduce hidden development bypasses, hard-coded admin accounts, debug authentication, or temporary rule relaxations into committed production paths.
15. Do not silently expand the business scope while implementing a related feature.
16. Keep configuration explicit. Environment-specific values must be documented and must not contain secrets that belong in trusted server environments.
17. Architecture decisions that materially change security, persistence, deployment, or data ownership must be documented before code is generated.

## Dependency approval test

Before adding a package or service, answer all of the following:

- What exact requirement does it satisfy?
- Why is the current stack insufficient?
- What runtime, security, maintenance, and bundle-size cost does it introduce?
- Is it maintained and appropriate for React, Expo, or Firebase?
- Can it be removed later without rewriting major parts of the system?

If these answers are weak, do not add it.

## Scope-change rule

A request that conflicts with the locked baseline is a scope change, not an implementation detail. Record the change first, identify affected skills and documentation, then implement it.

## Completion check

A foundation decision is acceptable only when it keeps the system easier to reason about, does not weaken security, does not introduce unnecessary infrastructure, and directly supports an approved requirement.
