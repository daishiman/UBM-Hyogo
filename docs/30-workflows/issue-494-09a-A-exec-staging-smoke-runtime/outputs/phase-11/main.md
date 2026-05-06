# Phase 11 outputs — issue-494-09a-A-exec-staging-smoke-runtime

## status

`pending`（runtime evidence 未取得 / 各 G1-G4 gate 実行待ち）

実行完了時に `executed (acquired_at: <ISO8601>)` へ更新する。

## evidence 一覧表（実行時に 13 行を埋める）

| # | 種別 | path | sha256 | size_bytes | acquired_at_utc | result | notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight cf-whoami | `…/outputs/phase-11/evidence/preflight/cf-whoami.log` | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | |
| 2 | D1 migrations list (staging) | `…/d1/d1-migrations-staging.log` | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | |
| 3 | D1 migrations list (prod) | `…/d1/d1-migrations-prod.log` | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | |
| 4 | D1 schema parity | `…/d1/d1-schema-parity.json` | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | diffCount を notes に記録 |
| 5 | api deploy log | `…/deploy/deploy-api-staging.log` | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | version id を notes に記録 |
| 6 | web deploy log | `…/deploy/deploy-web-staging.log` | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | version id を notes に記録 |
| 7 | Forms schema sync | `…/forms/forms-schema-sync.log` | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | |
| 8 | Forms responses sync | `…/forms/forms-responses-sync.log` | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | |
| 9 | sync_jobs dump | `…/forms/sync-jobs-staging.json` | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | |
| 10 | audit_log dump | `…/forms/audit-log-staging.json` | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | |
| 11 | Playwright report + trace | `…/playwright/` | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | |
| 12 | screenshots (4 PNG) | `…/screenshots/{public-members,login,me,admin}-staging.png` | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | 4 ファイル合算 |
| 13 | wrangler tail (30min redacted) | `…/wrangler-tail/api-30min.log` | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | 取得不能時は理由テンプレ |

> path prefix: `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-11/evidence/`

## approval gate 取得記録（Phase 13 main.md と同期）

| Gate | approved_at (UTC) | approved_by | command_executed | evidence_paths |
| --- | --- | --- | --- | --- |
| G1 | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE |
| G2 | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE |
| G3 | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE |
| G4 | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE |

## 親タスクへの引き渡し

- 09c blocker 更新差分 reference: PENDING_RUNTIME_EVIDENCE
- 新規起票した unassigned-task 一覧: PENDING_RUNTIME_EVIDENCE
- 親 spec `outputs/phase-11/main.md` 反映状況: PENDING_RUNTIME_EVIDENCE

## rollback 用旧 version ID（事前準備で記録）

- api: PENDING_RUNTIME_EVIDENCE
- web: PENDING_RUNTIME_EVIDENCE

## redaction grep 確認

- `grep -RE '(Bearer |Authorization: [A-Za-z0-9])' $EVID`: PENDING_RUNTIME_EVIDENCE
- `grep -RE '[A-Za-z0-9._%+-]+@(?!senpai-lab\.com|gmail\.com)[A-Za-z0-9.-]+\.[A-Za-z]{2,}' $EVID`: PENDING_RUNTIME_EVIDENCE
