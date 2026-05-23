# Phase 5: 実装ランブック — Summary

references 5 ファイル + backlog 2 entry + 3 物理 backlink + 2 ledger fallback を編集し、`pnpm indexes:rebuild` で skill indexes を再生成した。詳細は `file-edit-runbook.md` / `backlink-runbook.md`。

## 実適用結果

| 対象 | 変更内容 |
|------|---------|
| api-endpoints.md L67-78 | 単一 `/admin/sync` / `/admin/sync/run` / `/admin/sync/backfill` / `/admin/sync/audit` / `/admin/smoke/sheets` を historical 別表へ移送。current は `/admin/sync/schema` + `/admin/sync/responses` のみ |
| environment-variables.md L55 | `GOOGLE_SERVICE_ACCOUNT_JSON` を Forms API 用（current）+ u-04 legacy 注記に修正 |
| environment-variables.md L65 | `SYNC_ADMIN_TOKEN` 射程を current split endpoint のみに限定 |
| environment-variables.md L436 | 同上（API Worker section） |
| environment-variables.md L442, L443 | `GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` を historical (legacy) + Required=No に降格 |
| deployment-cloudflare.md L293 | current sync 説明を Forms API split endpoint に置換、Sheets API v4 説明は historical note へ移送 |
| deployment-secrets-management.md L86 | `GOOGLE_SERVICE_ACCOUNT_JSON` を Forms API current + u-04 legacy 併記に修正 |
| architecture-overview-core.md L243 | admin sync 行を Forms API split endpoint + `sync_jobs` ledger に書き換え、u-04 Sheets→D1 sync を legacy 化 |
| task-workflow-backlog.md L349, L350 | UT-DSC-MIGRATION-SCRIPT-001 / UT-DSC-SYNC-AUDIT-APPEND-ONLY-001 を `status: superseded（2026-04-30 / issue-291）` に変更 |
| 03a / 03b / 02c index.md | legacy umbrella 逆リンクセクションを append |
| task-workflow-active.md 04c / 09b row | ledger fallback 逆リンク 1 文を append |
| `.claude/skills/aiworkflow-requirements/indexes/*` | `pnpm indexes:rebuild` で再生成 |
