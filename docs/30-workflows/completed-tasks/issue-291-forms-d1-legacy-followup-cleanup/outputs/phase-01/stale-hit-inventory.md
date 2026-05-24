# Stale Hit Inventory (rg-based)

`rg -n "Google Sheets API|spreadsheets\.values\.get|sync_audit|/admin/sync\b" .claude/skills/aiworkflow-requirements/references` の実測 hit を current drift / historical / superseded backlog に分類した結果。

## current drift（要更新）

| ファイル | 行 | 内容 |
|---------|----|------|
| api-endpoints.md | L69-74 | 単一 `/admin/sync` 互換 mount、`/admin/sync/run`、`/admin/sync/backfill`、`/admin/sync/audit`、`/admin/smoke/sheets` を current 表記 |
| environment-variables.md | L55 | `GOOGLE_SERVICE_ACCOUNT_JSON` を「Sheets API 用」と current 記述 |
| environment-variables.md | L65 | `SYNC_ADMIN_TOKEN` 射程に legacy `/admin/sync*` を含む |
| environment-variables.md | L436 | `SYNC_ADMIN_TOKEN` 射程に単一 `/admin/sync` を含む |
| environment-variables.md | L442, L443 | `GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` を Required 表記 |
| deployment-cloudflare.md | L293 | Google Sheets API v4 同期を current として記述 |
| deployment-secrets-management.md | L86 | `GOOGLE_SERVICE_ACCOUNT_JSON` を「Sheets API 用」と current 記述 |
| architecture-overview-core.md | L243 | admin sync が「u-04 Sheets → D1 sync」前提 |

## superseded backlog（status 変更）

| ファイル | 行 | entry |
|---------|----|-------|
| task-workflow-backlog.md | L349 | UT-DSC-MIGRATION-SCRIPT-001 |
| task-workflow-backlog.md | L350 | UT-DSC-SYNC-AUDIT-APPEND-ONLY-001 |

## historical（残す）

- lessons-learned-* / task-workflow-completed.md / workflow-task-sync-forms-d1-legacy-umbrella-artifact-inventory.md / lessons-learned-ut-03-sheets-auth-2026-04.md 等の歴史記録
- api-endpoints.md L78（u-04 sync section 全文を historical note へ移送済み）
- deployment-cloudflare.md L255 周辺の UT-21 close-out note（既に historical 化）
