# UT-17-followup-003 System Spec Update Summary

[実装区分: 実装仕様書]

## Classification

| Field | Value |
| --- | --- |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implementation_completed_external_ops_pending |
| implementation_status | CODE_COMPLETE_EXTERNAL_OPS_PENDING |
| parent_workflow | ut-17-cloudflare-analytics-alerts |
| related_followups | ut-17-followup-001 / 002 / 004（独立） |

## Same-Wave Sync Decision

本 wave では `apps/api` の scheduled handler / 既存 wrangler cron trigger への相乗り / Resend メールフォールバック /
unit tests / runbook 役割分担追記をローカル完了させる。
External ops（secrets 投入 / staging deploy / production deploy / 手動 cron 発火確認 / mail fallback 実画面確認 / commit / push / PR）はユーザー実施として残す。
全体 status は `implementation_completed_external_ops_pending` / `CODE_COMPLETE_EXTERNAL_OPS_PENDING`。

---

## Step 1-A：完了タスク記録

| 更新対象 | 更新内容 |
| --- | --- |
| `docs/30-workflows/unassigned-task/ut-17-followup-003-alert-relay-automated-healthcheck-cron.md` | external ops 完了後 `docs/30-workflows/completed-tasks/` 配下へ物理移動 |
| `docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/index.md`（存在する場合） | status を `implementation_completed_external_ops_pending` で記録、外部 ops 完了で `completed` に更新 |
| `.claude/skills/task-specification-creator/LOGS/_legacy.md` または changelog fragment | 「UT-17 followup-003 cron healthcheck ローカル完了 / Issue #635 spec 追記」を追記 |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` または changelog fragment | 「Cloudflare Workers scheduled cron による週次 alert-relay healthcheck 実装ローカル完了」を追記 |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | `cron healthcheck` / `weekly healthcheck` / `Monday gate` / `Resend fallback` / `scheduled handler` キーワード追加 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | `monitoring` / `cloudflare-deployment` セクションに UT-17 followup-003 (週次 healthcheck cron) を追加 |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | 「Workers scheduled cron triggers」サブセクションを追記し、`0 18 * * *` daily + Monday gate の運用方針を明記。env binding 3 種 (`SLACK_WEBHOOK_URL_HEALTHCHECK?` / `HEALTHCHECK_FALLBACK_EMAIL?` / `RESEND_API_KEY?`) を「optional secrets」表に追加 |

## Step 1-B：実装状況テーブル更新

| 項目 | 値 |
| --- | --- |
| 旧ステータス | `spec_created` |
| 新ステータス（本サイクル完了時） | `implementation_completed_external_ops_pending` |
| External ops 完了後ステータス | `completed` |
| 反映先 | `docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/index.md`、unassigned-task index、artifacts.json (phase-12) |
| 補足 | external ops（secrets 投入 / staging deploy / 実 cron 発火 / production deploy）完了かつ Phase 13 PR マージ時点で `completed` に更新し completed-tasks へ移動 |

## Step 1-C：関連タスクテーブル更新

| 関連タスク | 備考更新内容 |
| --- | --- |
| **UT-17 親（ut-17-cloudflare-analytics-alerts）** | 「followup-003 で alert-relay 経路の週次自動 healthcheck (cron) を追加。月次 runbook は補助に降格」を備考に追記 |
| **ut-17-followup-001 / 002 / 004** | 独立。本タスクとの依存・影響なし（cron trigger / Resend / Monday gate はいずれも他 followup と機能領域が異なる） |
| **UT-08-IMPL** | 影響なし。UT-08 は WAE custom alerts 軸で、本タスクは Cloudflare native usage alerts 経路の生死確認軸 |
| **UT-14（WAF / Rate Limiting）** | 影響なし。cron は内部発火のため `/internal/alert-relay` への external request を経由しない |
| **UT-18（Workers CPU time）** | 影響なし。CPU time 計測対象は本物アラート由来。週 1 回の healthcheck 増分は無視可能 |

## Step 2：システム仕様更新判定

| 判定項目 | 結論 |
| --- | --- |
| 新規インターフェース追加 | **あり** — Workers `scheduled` export（cron trigger による内部発火、external API surface ではない） |
| 既存インターフェース変更 | なし（`/internal/alert-relay` の external API surface は不変。Request 偽造経路のみ追加） |
| 新規定数 / 設定値 | あり — `SLACK_WEBHOOK_URL_HEALTHCHECK?` / `HEALTHCHECK_FALLBACK_EMAIL?` / `RESEND_API_KEY?`（全て optional secrets）、cron schedule `0 18 * * *`、Monday gate (`getUTCDay() === 1`)、healthcheck payload identifier (`name: "UT-17 weekly healthcheck"`, `severity: "info"`, `data.healthcheck: true`) |
| 反映先 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`（cron triggers セクション + optional secrets 表）、`indexes/keywords.json`、`indexes/topic-map.md` |
| `apps/api` binding 一覧文書 update 要否 | **要**。`apps/api/src/env.ts` の Env interface に 3 binding 追加 = 「Worker bindings の正本は env.ts」のため、ドキュメント側は env.ts へのリンクで足り、別 binding 一覧文書がなければ新規作成は不要 |
| 結論 | **Step 2 実施**（aiworkflow-requirements に cron healthcheck セクション + optional secrets を反映） |
| 再判定条件 | 将来 healthcheck の頻度を週次 → 日次に変更する場合、または別 Worker（apps/web 等）に cron を追加する場合に再評価 |

---

## Artifacts Parity

Root `artifacts.json` 更新（Phase 1-12 completed、Phase 13 `blocked_pending_user_approval`）。
`outputs/artifacts.json` full mirror も配置済み。小規模 followup でも省略しない。

## Mirror Parity

`.claude/skills/aiworkflow-requirements` と `.agents/skills/aiworkflow-requirements` 間で
indexes / references の同期確認を Phase 13 ローカルチェック内で実施する。

```bash
diff -r .claude/skills/aiworkflow-requirements .agents/skills/aiworkflow-requirements 2>/dev/null | head
# 期待: 差分なし
```
