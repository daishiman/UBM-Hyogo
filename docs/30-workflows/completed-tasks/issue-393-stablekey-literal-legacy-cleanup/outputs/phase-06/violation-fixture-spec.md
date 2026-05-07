# Phase 6 Violation Fixture Spec

The existing `scripts/lint-stablekey-literal.test.ts` fixture coverage remains the canonical abnormal-case check for:

- allow-list acceptance,
- non-allow-list violation detection,
- strict mode non-zero exit on violation,
- comment exclusion,
- exception globs for tests and fixtures.

This workflow adds the issue-393 regression expectation that the scoped application tree has 0 strict violations.

