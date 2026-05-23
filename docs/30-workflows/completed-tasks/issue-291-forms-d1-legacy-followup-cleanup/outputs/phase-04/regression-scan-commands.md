# Regression Scan Commands

## 1. stale current scan

```bash
rg -n "Google Sheets API|spreadsheets\.values\.get|sync_audit|/admin/sync\b" \
  .claude/skills/aiworkflow-requirements/references \
  | rg -v "lessons-learned-|task-workflow-completed|task-workflow-active|workflow-task-sync-forms-d1-legacy-umbrella-artifact-inventory|legacy（UT-09 で廃止|historical:"
```

期待: current section に Sheets API / 単一 `/admin/sync` / `sync_audit` を残存させない（残るのは current section の `/admin/sync/schema` / `/admin/sync/responses` と historical 別表のみ）。

## 2. conflict marker scan

```bash
rg -n "^(<<<<<<<|=======|>>>>>>>)" \
  .claude/skills/aiworkflow-requirements/references \
  docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup
```

期待: 0 hit。

## 3. backlink scan

```bash
rg -l "task-sync-forms-d1-legacy-umbrella-001" \
  docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue \
  docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver \
  docs/30-workflows/completed-tasks/02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary

rg -n "issue-291-forms-d1-legacy-followup-cleanup" \
  .claude/skills/aiworkflow-requirements/references/task-workflow-active.md
```

期待: 3 物理 hit + 2 ledger fallback row hit。

## 4. index drift

```bash
git diff --stat .claude/skills/aiworkflow-requirements/indexes
```

`pnpm indexes:rebuild` 後に references 更新由来の差分のみが現れること。

## 5. Phase 12 readiness

```bash
jq '.phases[] | select(.phase == 12) | .outputs' \
  docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup/artifacts.json
```

## 6. backlog status

```bash
rg -n "UT-DSC-MIGRATION-SCRIPT-001|UT-DSC-SYNC-AUDIT-APPEND-ONLY-001" \
  .claude/skills/aiworkflow-requirements/references/task-workflow-backlog.md
```

期待: 両 entry に `status: superseded` annotation が付与されていること。
