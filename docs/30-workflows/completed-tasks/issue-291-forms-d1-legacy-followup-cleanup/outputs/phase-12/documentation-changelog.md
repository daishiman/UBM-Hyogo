# Documentation Changelog

## Entry Checklist

```text
$ git status --porcelain -- apps/ packages/
<no output>

$ git diff --name-only main...HEAD -- 'apps/**' 'packages/**'
696 paths in the existing branch baseline. This review cycle did not touch those paths; `git status --porcelain -- apps/ packages/` is clean.
```

`apps/` and `packages/` dirty diff 0件確認済み。The `main...HEAD` application diff is a pre-existing branch baseline and is not used as completion evidence for this Issue #291 docs-only cleanup.

## Step 1-A: Task Completion Record

- Added canonical workflow root for Issue #291 closed-issue recovery.
- Preserved the source unassigned task with a consumed pointer.
- Added aiworkflow artifact inventory for the workflow.

## Step 1-B: Implementation Status Tables

- Updated current guidance files under `.claude/skills/aiworkflow-requirements/references/`.
- Updated `task-workflow-backlog.md` superseded rows for legacy `sync_audit` tasks.
- Updated `task-workflow-active.md` with ledger fallback backlinks and Issue #291 workflow state.
- No runtime code, migration, or secret change was made.

## Step 1-C: Related Task Tables

- Physical backlinks: 03a / 03b / 02c.
- Ledger fallback backlinks: 04c / 09b.

## Step 2: Domain Sync

- No new domain model or API contract.
- Existing domain wording was synchronized to current = Forms API + split sync endpoint + `sync_jobs`.

## Workflow-Local Sync vs Global Skill Sync

| Category | Result |
| --- | --- |
| Workflow artifacts | `index.md`, `artifacts.json`, `outputs/artifacts.json`, Phase 12 strict 7 files updated. |
| aiworkflow-requirements references | Current guidance and ledgers updated. |
| task-specification-creator skill | No template behavior change required; existing Phase 12 rules were applied. |
| Skill history ledger | No skill source file was changed in this review cycle. |

## Validators and Checks

| Command | Result |
| --- | --- |
| `git status --porcelain -- apps/ packages/` | exit 0, match 0 |
| `git diff --name-only main...HEAD -- 'apps/**' 'packages/**'` | exit 0, 696 baseline paths; task-local dirty diff 0 |
| `cmp -s docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup/artifacts.json docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup/outputs/artifacts.json` | PASS after parity correction |
| `mise exec -- pnpm indexes:rebuild` | exit 0, topic-map and keywords regenerated |
| `mise exec -- pnpm verify:phase12-compliance` | exit 0, status `pass` for this workflow root |
| `rg -n "Google Sheets API\|spreadsheets\\.values\\.get\|sync_audit\|/admin/sync\\b" .claude/skills/aiworkflow-requirements/references` | Remaining hits are current split endpoints or explicit historical/legacy notes. |
