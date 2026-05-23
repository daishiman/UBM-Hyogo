# System Spec Update Summary

## Workflow Local

- `index.md` の "guarantee" 表現を KV eventual consistency と整合する表現へ変更した。
- `phase-04.md` / `phase-11.md` の test path を現行実体 `apps/api/src/routes/internal/__tests__/alert-relay.test.ts` に同期した。
- `artifacts.json` と `outputs/artifacts.json` に Phase 12 strict 7 を追加した。

## aiworkflow-requirements

- `indexes/resource-map.md`、`indexes/quick-reference.md`、`references/task-workflow-active.md`、`LOGS/_legacy.md` に UT-17 follow-up 002 を登録する。
- `references/workflow-ut-17-followup-002-alert-relay-dedup-kv-artifact-inventory.md` を追加する。

## Step 2: 新規 interface 変更

- **該当: あり**。`apps/api/src/env.ts` の `Env` に `ALERT_DEDUP_KV: KVNamespace` を必須プロパティとして追加。
- `apps/api/src/routes/internal/alert-relay.ts` の `AlertRelayEnv` にも同型を追加。
- 副次変更: `apps/api/src/index.ts` に `FormsClientEnv extends ResponseSyncEnv` を導入し、`buildFormsClient` の env 型を narrow 化（KV 必須化と admin route slot の型整合）。
- aiworkflow-requirements の関連仕様（api-* / interfaces-* 系）に `ALERT_DEDUP_KV` binding 追記の予約は別 sync workflow で処理する。

## Step 1-C: 既存 unassigned-task spec

`docs/30-workflows/unassigned-task/ut-17-followup-002-alert-relay-dedup-kv-persistence.md` は本 workflow で formalize 完了。closed 扱いとし、参照は本 workflow に集約する。

## Boundary

- 本サイクルでコード実装・テスト・runbook 追記を完了した。
- Cloudflare KV namespace 作成、wrangler.toml への実 namespace id 反映、staging/production deploy、Slack runtime smoke、commit、push、PR は引き続き user-gated。
