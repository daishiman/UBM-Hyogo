# Phase 4: タスク分解

| ID | サブタスク | 対象ファイル | DoD |
| --- | --- | --- | --- |
| T1 | quota-base.json 編集 | infra/cloudflare-alerts/quota-base.json | KV キー 2 件追加 + snapshotAt 更新 |
| T2 | KV policy JSON 新規作成 | infra/cloudflare-alerts/policies/workers-kv-writes-per-day.json, workers-kv-stored-bytes.json | 2 件、`enabled: false` |
| T3 | schema 拡張 | (skip) | Phase 2 判定で不要 |
| T4 | lib 更新 | (skip) | Phase 2 判定で不要 |
| T5 | テスト追加 | infra/cloudflare-alerts/lib/__tests__/load.spec.ts (または新規 KV spec) | applyQuotaBase / loadExpected が KV policy を扱える PASS |
| T6 | README 更新 | infra/cloudflare-alerts/README.md | policy 一覧に KV 2 行追加 |
| T7 | runbook 更新 | docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md | Step 4 / 4b に KV IaC 自動化を反映 |
| T8 | staging apply (別フェーズ Phase 10) | (mutation) | user 承認後実施 |
