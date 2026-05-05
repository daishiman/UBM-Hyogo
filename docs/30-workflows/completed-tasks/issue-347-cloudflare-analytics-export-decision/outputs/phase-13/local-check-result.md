# Local Check Result

state: completed

## Executed checks

```bash
diff -u docs/30-workflows/issue-347-cloudflare-analytics-export-decision/artifacts.json \
  docs/30-workflows/issue-347-cloudflare-analytics-export-decision/outputs/artifacts.json
```

Result: PASS（差分なし）

```bash
ls -1 docs/30-workflows/issue-347-cloudflare-analytics-export-decision/outputs/phase-12 | sort
```

Result: PASS（7 files）

```bash
grep -iE "clientIP|originIP|userAgent|email|memberId|sessionId|token|requestBody|responseBody|query|pathWithQuery" \
  docs/30-workflows/issue-347-cloudflare-analytics-export-decision/outputs/phase-11/evidence/sample-export/analytics-export-schema-sample.json \
  && echo FAIL || echo PASS
```

Result: PASS

```bash
rg -n "issue-347-cloudflare-analytics-export-decision|task-issue-347-cloudflare-analytics-export-automation-001" \
  .claude/skills/aiworkflow-requirements \
  docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/index.md
```

Result: PASS（aiworkflow-requirements と 09c parent に導線あり）

```bash
pnpm typecheck
```

Result: PASS

```bash
pnpm lint
```

Result: PASS（exit 0）。既存 warning: `apps/api/src/repository/identity-conflict.ts` の stableKey literal 2 件。本 docs-only 差分外。

```bash
pnpm indexes:rebuild
```

Result: PASS。`topic-map.md` / `keywords.json` regenerated with no additional tracked drift observed.

```bash
node .claude/skills/aiworkflow-requirements/scripts/validate-structure.js
```

Result: PASS with existing size warnings for 5 reference files over 500 lines. The warnings are pre-existing documentation size concerns and do not block Issue #347 compliance.
