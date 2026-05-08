# Phase 9: Test Plan

## Test Files

| Path | Cases |
| --- | --- |
| `scripts/cf-audit-log/__tests__/feature-export.test.ts` | clean export, manifest hash, schema validation, leakage fail, missing secret, invalid window |
| `scripts/cf-audit-log/__tests__/features-extract.test.ts` | existing redaction behavior remains green |
| `scripts/cf-audit-log/__tests__/evaluation.test.ts` | `scanForSecrets()` clean/positive behavior remains green |
| `scripts/cf-audit-log/__tests__/redaction-guard.test.ts` | stronger JSONL guard remains green |

## Focused Commands

```bash
pnpm exec vitest run scripts/cf-audit-log/__tests__/feature-export.test.ts scripts/cf-audit-log/__tests__/features-extract.test.ts scripts/cf-audit-log/__tests__/evaluation.test.ts scripts/cf-audit-log/__tests__/redaction-guard.test.ts
pnpm typecheck
pnpm lint
```

## Expected Assertions

- JSONL does not contain source fixture email/IP/UA.
- Positive fixture with full IP exits non-zero.
- Manifest SHA equals final JSONL SHA.
- Empty result window produces valid empty JSONL and manifest rowCount 0.

## Completion

- Test plan covers AC-1 through AC-8.
