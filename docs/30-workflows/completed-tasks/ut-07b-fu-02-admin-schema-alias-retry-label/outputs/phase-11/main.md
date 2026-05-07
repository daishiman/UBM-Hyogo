# Phase 11 Evidence - UT-07B-FU-02

判定: `COMPONENT_EVIDENCE_PASS_RUNTIME_SCREENSHOT_PENDING`

## Captured Evidence

| Evidence | Path | Result |
| --- | --- | --- |
| Focused Vitest JUnit | `outputs/phase-11/test-junit.xml` | PASS: 30 tests / 0 failures / 0 errors |

実行コマンド:

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/lib/admin/__tests__/api.test.ts \
  apps/web/src/components/admin/__tests__/SchemaDiffPanel.test.tsx \
  --reporter=default --reporter=junit \
  --outputFile.junit=/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260506-182313-wt-6/docs/30-workflows/ut-07b-fu-02-admin-schema-alias-retry-label/outputs/phase-11/test-junit.xml
```

## Pending Runtime Evidence

Manual screenshots are intentionally pending because they require a browser session with `/admin/schema` data and network override or fixture-controlled 202 / 422 / 409 responses. See `manual-evidence-deferred.md`.

Commit, push, PR, deploy, and Issue comment were not executed.
