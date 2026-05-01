# PR Template

Title: docs(issue-192): add stableKey literal lint enforcement workflow

## Summary

- Adds `03a-stablekey-literal-lint-enforcement` task specification.
- Defines ESLint/static-check enforcement for stableKey literals.
- Keeps workflow in `spec_created`; implementation evidence is deferred.

## Test Plan

- Phase 12 artifact existence check.
- JSON parse of root `artifacts.json`.
- No commit/push/PR without explicit approval.

Refs #192
