# rg before / after evidence

## scan

```bash
rg -n "Google Sheets API|spreadsheets\.values\.get|sync_audit|/admin/sync\b" \
  .claude/skills/aiworkflow-requirements/references
```

## before（Phase 5 編集前）

current section に下記が drift として存在していた:

- api-endpoints.md L69 `POST /admin/sync`（互換 mount）
- api-endpoints.md L70-72 `/admin/sync/run` / `/admin/sync/backfill` / `/admin/sync/audit` を current 表記
- api-endpoints.md L74 `/admin/smoke/sheets` を Sheets API v4 current 表記
- environment-variables.md L55 `GOOGLE_SERVICE_ACCOUNT_JSON` を「Google Sheets API 用」と current 記述
- environment-variables.md L65, L436 `SYNC_ADMIN_TOKEN` 射程に単一 `/admin/sync` を含む
- environment-variables.md L442, L443 `GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` を Required=Yes
- deployment-cloudflare.md L293 Sheets API v4 同期を current として記述
- deployment-secrets-management.md L86 Sheets API 用 と current 記述
- architecture-overview-core.md L243 u-04 Sheets→D1 sync を current として記述

## after（Phase 5 編集後）

current section に残るのは:

- `/admin/sync/schema`（03a 管轄、Forms `forms.get`）
- `/admin/sync/responses`（03b 管轄、Forms `forms.responses.list`）
- `sync_jobs` ledger（02c 管轄）

historical 別表に移送:

- 単一 `/admin/sync` / `/admin/sync/run` / `/admin/sync/backfill` / `/admin/sync/audit` / `/admin/smoke/sheets`
- `GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID`
- u-04 Sheets→D1 sync 説明

`sync_audit` / `sync_audit_logs` / `sync_audit_outbox` は新設禁止を明示。

## hit 分類

| 種別 | 件数 |
|------|------|
| 全 hit | 41 |
| current Forms API（残すべき） + historical 別表 + lessons-learned / completed / inventory / task-workflow 履歴 | 41 |
| current drift（要更新の残存） | 0 |
