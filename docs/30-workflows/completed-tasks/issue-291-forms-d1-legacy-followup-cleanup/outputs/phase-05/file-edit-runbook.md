# File Edit Runbook (file:line × before/after)

Phase 5 で実適用済み。実適用後の行番号は scan で再確認すること。

## api-endpoints.md L67-78（管理同期 API section）

- before: 単一 `POST /admin/sync` (互換 mount) / `POST /admin/sync/run` / `POST /admin/sync/backfill` / `GET /admin/sync/audit` / `POST /admin/sync/responses` / `GET /admin/smoke/sheets` を current 表として並列記述
- after: current 表は `POST /admin/sync/schema`（03a 管轄）と `POST /admin/sync/responses`（03b 管轄）のみ。残り 5 endpoint は **historical（UT-09 / u-04 legacy、新設禁止）** 別表へ移送し `sync_jobs` 集約を明示

## environment-variables.md L55

- before: `GOOGLE_SERVICE_ACCOUNT_JSON` を「Google Sheets API 用」と記述
- after: 「Google Forms API 用（current）+ u-04 legacy では Google Sheets API でも使用していた」に修正

## environment-variables.md L65

- before: `SYNC_ADMIN_TOKEN` 射程に単一 `/admin/sync` / `/admin/sync/run` / `/admin/sync/backfill` / `/admin/sync/audit` を含む
- after: 射程を `/admin/sync/schema` + `/admin/sync/responses` のみに限定し、legacy 経路は新設禁止を明示

## environment-variables.md L436

- before: `SYNC_ADMIN_TOKEN` を `/admin/sync` / `/admin/sync/schema` の Bearer
- after: `/admin/sync/schema` / `/admin/sync/responses` の Bearer。legacy `/admin/sync` は新設禁止

## environment-variables.md L442, L443

- before: `GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` を current Required=Yes
- after: historical（u-04 / UT-26 legacy）扱い、Required=No、issue-291 で legacy 化を明示

## deployment-cloudflare.md L293

- before: Google Sheets API v4 同期を current として説明
- after: Forms API split endpoint + `sync_jobs` を current として説明。Sheets API v4 経路は L255 周辺の UT-21 close-out note と整合する historical note へ移送

## deployment-secrets-management.md L86

- before: `GOOGLE_SERVICE_ACCOUNT_JSON` を「Google Sheets API 用」と current 記述
- after: Google Forms API 用（current）+ u-04 legacy 注記に修正

## architecture-overview-core.md L243

- before: admin sync 行が「u-04 Sheets → D1 sync」前提
- after: Forms API → D1 split endpoint sync（`apps/api/src/routes/admin/sync-schema.ts` + `apps/api/src/jobs/sync-forms-responses.ts` + `sync_jobs` ledger）+ u-04 Sheets→D1 sync を legacy 化

## task-workflow-backlog.md L349, L350

- before: UT-DSC-MIGRATION-SCRIPT-001 / UT-DSC-SYNC-AUDIT-APPEND-ONLY-001 を active entry として記述
- after: `~~strikethrough~~` + `**status: superseded（2026-04-30 / issue-291）**`、本文に「legacy umbrella `task-sync-forms-d1-legacy-umbrella-001` で `sync_jobs` ledger に集約済み」を併記
