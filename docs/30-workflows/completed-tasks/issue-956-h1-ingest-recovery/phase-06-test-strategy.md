# Phase 06 — 検証戦略

本タスクはコード変更を伴わないため、新規 unit / contract / e2e テストは追加しない。代わりに **runtime check** で AC を担保する。

## 6.1 検証マトリクス

| AC | 検証手法 | evidence |
|----|----------|----------|
| AC-1 (secret 投入済) | `cf.sh secret list` 出力に 3 キー含む | `outputs/phase-11/cf-secret-list.txt` |
| AC-2 (secretsReadiness 全 true) | snapshot-after JSON 抜粋 | `outputs/phase-11/snapshot-after.json` |
| AC-3 (H1 === false) | snapshot-after JSON 抜粋 | 同上 |
| AC-4 (success run ≥1) | snapshot-after.latestSyncRuns に `status:"success"` | 同上 |
| AC-5 (stale running 無) | S6 SQL 結果 0 行 | `outputs/phase-11/stale-lock-select.txt` |
| AC-6 (cron 起動観測) | `cf.sh tail` に scheduled 発火行 | `outputs/phase-11/cron-tail.log` |

## 6.2 既存 code-test 参照 (本タスクで再実行しない)

下記は親 PR #960 で実行済。本タスクで回帰させる対象はない。

- `apps/api/src/diagnostics/forms-pipeline.spec.ts` (H1 ロジック単体)
- `apps/api/src/diagnostics/forms-pipeline.contract.spec.ts` (snapshot schema)
- `apps/api/src/jobs/sheets-auth-classifier.spec.ts` (reason 分類)
- `apps/api/src/jobs/sync-forms-responses.contract.spec.ts` (ingest job contract)
- `apps/api/src/jobs/sync-forms-responses.types.contract.spec.ts`

## 6.3 secrets 値の検証外条件

- 1Password 上の値そのものの正否確認は本タスクのスコープ外 (op vault owner 責任)。
- 投入後 cron 1 cycle 観測で 401 が継続する場合は `sheets-auth-classifier` の reason code を見て followup (Phase 03 例外表) へ移譲する。

## 6.4 ローカル検証コマンド (該当無)

production-only タスクのため localhost 上での再現は行わない。`phase-10-local-verification.md` に該当なし宣言を記載する。
