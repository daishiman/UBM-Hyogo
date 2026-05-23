# Manual Test Result (NON_VISUAL)

## scan execution (2026-05-22)

| # | scan | hit count | 判定 |
|---|------|-----------|------|
| 1 | stale current scan（filtered） | 0（current section に legacy 表記なし） | PASS |
| 2 | conflict marker scan | 0 | PASS |
| 3 | backlink scan（3 物理） | `rg -l "task-sync-forms-d1-legacy-umbrella-001"` で 03a / 03b / 02c index.md の 3 hit | PASS |
| 3' | backlink scan（2 ledger fallback） | `task-workflow-active.md` の 04c / 09b row に `issue-291-forms-d1-legacy-followup-cleanup` を含む 2 hit | PASS |
| 4 | index drift | `pnpm indexes:rebuild` 後 references 更新由来差分のみ | PASS |
| 5 | Phase 12 readiness | `jq` で 7 outputs 全て列挙、物理存在確認済み | PASS |
| 6 | backlog status | UT-DSC-MIGRATION-SCRIPT-001 / UT-DSC-SYNC-AUDIT-APPEND-ONLY-001 に `status: superseded（2026-04-30 / issue-291）` を確認 | PASS |
