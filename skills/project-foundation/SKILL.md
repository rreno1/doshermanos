# Project Foundation

## Purpose

Keep Dos Hermanos small, understandable, secure, and aligned with the approved project scope.

## Use this skill when

Making stack, dependency, platform, integration, or high-level implementation decisions.

## Locked baseline

- Web: React + TypeScript + Vite.
- Mobile: Expo React Native.
- Authentication: Firebase Authentication.
- Database: Cloud Firestore.
- Hosting: Firebase Hosting for the web application.
- Current payment scope: manual payment recording only.
- PayMongo is intentionally excluded for now.
- Cloud Functions are intentionally excluded for now.

## Hard rules

1. Do not add services, frameworks, state libraries, backend layers, or integrations unless the current requirement needs them.
2. Do not add PayMongo, Cloud Functions, AI features, offline synchronization, or unrelated business modules unless explicitly approved later.
3. Prefer native platform and Firebase capabilities before adding dependencies.
4. Every dependency must solve a concrete project problem and must be smaller than the complexity it removes.
5. Keep web and mobile as separate applications sharing the same Firebase project and business data.
6. Keep staff/admin-heavy workflows on web unless there is a clear mobile requirement.
7. Keep customer mobile workflows focused on packages, reservations, status, and permitted payment information.

## Completion check

Before adding a technology or dependency, state the requirement it solves. If that requirement does not exist, do not add it.
