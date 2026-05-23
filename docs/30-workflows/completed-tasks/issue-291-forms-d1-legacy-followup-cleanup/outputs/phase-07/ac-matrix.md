# Acceptance Criteria Matrix

| # | AC | 検証方法 | 結果 |
|---|----|---------|------|
| AC-01 | references 5 ファイルの current section から単一 `/admin/sync` / `sync_audit` / Google Sheets API current 表記が消える | Phase 4 scan #1 | PASS |
| AC-02 | historical 別表または前後文脈に legacy 注記が付き、削除はしない | `git diff --stat .../lessons-learned-*.md` = 0 | PASS |
| AC-03 | `task-workflow-backlog.md` の UT-DSC-MIGRATION-SCRIPT-001 / UT-DSC-SYNC-AUDIT-APPEND-ONLY-001 に `status: superseded` annotation がある | Phase 4 scan #6 | PASS |
| AC-04 | 03a / 03b / 02c の `index.md` 末尾に legacy umbrella 逆リンクが追加されている | Phase 4 scan #3（前段） | PASS |
| AC-05 | `task-workflow-active.md` の 04c / 09b row 末尾に ledger fallback 逆リンク 1 文がある | Phase 4 scan #3（後段） | PASS |
| AC-06 | `pnpm indexes:rebuild` を実行し意図外差分がない | Phase 4 scan #4 | PASS |
| AC-07 | runtime code（`apps/` / `packages/`）、D1 migration、Cloudflare Secret に変更がない | `git status --short apps/ packages/ apps/api/db/migrations/` | PASS（差分 0） |
| AC-08 | conflict marker が混入していない | Phase 4 scan #2 | PASS |
| AC-09 | Phase 12 必須 7 outputs が揃っている | Phase 4 scan #5 + 物理確認 | PASS |
