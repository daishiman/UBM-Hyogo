# Documentation Changelog

| Date | File | Change |
| --- | --- | --- |
| 2026-05-13 | `index.md` | Replaced exactly-once guarantee wording with practical dedup reduction. |
| 2026-05-13 | `phase-01.md`, `phase-04.md`, `phase-11.md` | Corrected alert-relay test path to current source tree. |
| 2026-05-13 | `phase-12.md` | Aligned Phase 12 with strict 7 outputs and canonical state vocabulary. |
| 2026-05-13 | `artifacts.json`, `outputs/artifacts.json` | Added strict 7 ledger and mirror parity. |
| 2026-05-13 | `unassigned-task/ut-17-followup-002-alert-relay-dedup-kv-persistence.md` | Marked source task as transferred to successor workflow. |

## Workflow-local 実装変更（本サイクルで追加）

| Date | File | Change |
| --- | --- | --- |
| 2026-05-13 | `apps/api/src/env.ts` | `Env` に `ALERT_DEDUP_KV: KVNamespace` を必須プロパティとして追加 |
| 2026-05-13 | `apps/api/src/routes/internal/alert-relay.ts` | `AlertRelayEnv` に KV 型追加。`seenAlerts` Map と TTL 走査ループを削除し、Slack 配信成功後のみ `get`/`put` 経由 dedup に保存 |
| 2026-05-13 | `apps/api/src/routes/internal/__tests__/alert-relay.test.ts` | KV stub inject 形式に再構成、TC-KV-01〜09 / TC-03 / Slack failure retry を追加（21 ケース全 PASS） |
| 2026-05-13 | `apps/api/test/helpers/kv-stub.ts`（新規） | Miniflare 互換 KV stub helper |
| 2026-05-13 | `apps/api/wrangler.toml` | `[[env.{staging,production}.kv_namespaces]]` user-gated block をコメント化して追加（active placeholder id は置かない） |
| 2026-05-13 | `apps/api/src/index.ts` | `FormsClientEnv extends ResponseSyncEnv` を導入。`buildFormsClient` の env 型を narrow 化 |
| 2026-05-13 | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | Step 4b「ALERT_DEDUP_KV namespace 健全性確認」を追記 |
| 2026-05-13 | `outputs/phase-01..11/` | Phase 1-11 成果物を実装結果で更新 |
| 2026-05-13 | `outputs/phase-11/evidence/` | typecheck.txt / lint.txt / api-test.txt を保存 |

## Global skill sync

- aiworkflow-requirements の `SKILL.md` / `SKILL-changelog.md` / LOGS / indexes / task-workflow-active / artifact inventory を同一 wave で更新。
