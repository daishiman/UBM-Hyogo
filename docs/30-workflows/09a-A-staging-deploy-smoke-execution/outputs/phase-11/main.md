# outputs phase-11: 09a-A-staging-deploy-smoke-execution

[実装区分: 実装仕様書 — 実行時 evidence 受け皿]

- status: pending（実行後 `executed` に更新）
- purpose: 手動 smoke / 実測 evidence 取得（13 evidence + 4 approval gate）
- expected artifacts: `evidence/` 配下 13 種別（下表参照）
- evidence path:
  - `outputs/phase-11/evidence/deploy/`（#1, #2）
  - `outputs/phase-11/evidence/curl/`（#3, #4 系列）
  - `outputs/phase-11/evidence/screenshots/`（#5）
  - `outputs/phase-11/evidence/playwright/`（#6）
  - `outputs/phase-11/evidence/forms/`（#7, #8）
  - `outputs/phase-11/evidence/d1/`（#9, #10, #12, #13）
  - `outputs/phase-11/evidence/wrangler-tail/`（#11）
- approval gate: G1 (deploy) / G2 (D1 migration apply) / G3 (Forms sync) / G4 (blocker 更新コミット)

## 実行時記録欄: evidence サマリ表（実行者が更新）

| # | 種別 | path | hash (sha256) | size_bytes | acquired_at_utc | result | notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | api deploy log | `evidence/deploy/deploy-api-staging.log` | _pending_ | _pending_ | _pending_ | _pending_ | |
| 2 | web deploy log | `evidence/deploy/deploy-web-staging.log` | _pending_ | _pending_ | _pending_ | _pending_ | |
| 3 | curl public (healthz + /public/members 各種) | `evidence/curl/curl-public-*.log` | _pending_ | _pending_ | _pending_ | _pending_ | 9 ファイル想定 |
| 4 | curl authz (3 種) | `evidence/curl/curl-authz-*.log` | _pending_ | _pending_ | _pending_ | _pending_ | |
| 5 | UI screenshots (4 種) | `evidence/screenshots/{public-members,login,me,admin}-staging.png` | _pending_ | _pending_ | _pending_ | _pending_ | PII redact 確認必須 |
| 6 | Playwright report / trace | `evidence/playwright/` | _pending_ | _pending_ | _pending_ | _pending_ | |
| 7 | Forms schema sync log | `evidence/forms/forms-schema-sync.log` | _pending_ | _pending_ | _pending_ | _pending_ | |
| 8 | Forms responses sync log | `evidence/forms/forms-responses-sync.log` | _pending_ | _pending_ | _pending_ | _pending_ | |
| 9 | sync_jobs dump | `evidence/d1/sync-jobs-staging.json` | _pending_ | _pending_ | _pending_ | _pending_ | |
| 10 | audit_log dump | `evidence/d1/audit-log-staging.json` | _pending_ | _pending_ | _pending_ | _pending_ | |
| 11 | wrangler tail (redacted) | `evidence/wrangler-tail/api-30min.log` | _pending_ | _pending_ | _pending_ | _pending_ | 取得不能時はテンプレ記録 |
| 12 | D1 migration list | `evidence/d1/d1-migrations-staging.log` | _pending_ | _pending_ | _pending_ | _pending_ | |
| 13 | D1 schema parity | `evidence/d1/d1-schema-parity.json` | _pending_ | _pending_ | _pending_ | _pending_ | diffCount を notes に明記 |

## 実行時記録欄: approval gate 取得記録

| gate | approved_at | approved_by | command_executed |
| --- | --- | --- | --- |
| G1 | _pending_ | _pending_ | _pending_ |
| G2 | _pending_ | _pending_ | _pending_ |
| G3 | _pending_ | _pending_ | _pending_ |
| G4 | _pending_ | _pending_ | _pending_ |

## 親タスクへの引き渡し

- 09c blocker 更新差分: _pending_
- 起票した unassigned-task: _pending_
