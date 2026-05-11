# UT-17 System Spec Update Summary

## Classification

| Field | Value |
| --- | --- |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implementation_completed_external_ops_pending |
| implementation_status | CODE_COMPLETE_EXTERNAL_OPS_PENDING |

## Same-Wave Sync Decision

The current wave implements the local `apps/api` relay code, tests, runbooks, and workflow package. Global aiworkflow status must therefore be `implemented-local` / `CODE_COMPLETE_EXTERNAL_OPS_PENDING`, not `spec_created`.

## Required Future Sync

External operations remain user-gated: Cloudflare Secrets placement, staging/production deploy, Cloudflare Notification Policy setup, Slack runtime smoke, commit, push, and PR.

## Artifacts Parity

Root `artifacts.json` exists. `outputs/artifacts.json` is a lightweight parity marker, not a full mirror.

---

## Step 1-A：完了タスク記録

| 更新対象 | 更新内容 |
| --- | --- |
| `docs/30-workflows/ut-17-cloudflare-analytics-alerts/index.md` | 実装ローカル完了を反映（`spec_created` → `implementation_completed_external_ops_pending`）。external ops 完了後に completed-tasks へ移動 |
| `.claude/skills/task-specification-creator/LOGS/_legacy.md`（または changelog fragment） | 「UT-17 Phase 1-12 ローカル完了 / 外部 ops 残（T1/T2/T8/T9/T10）」を追記 |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md`（または changelog fragment） | 「Cloudflare 無料枠アラート + Slack 日本語化 relay Worker 実装ローカル完了」を追記 |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | `Cloudflare Notifications` / `Slack 日本語化 relay` / `alert relay` / `cf-webhook-auth verify` キーワード追加 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | monitoring / alert セクションに UT-17 を追加（Cloudflare native usage alerts の正本として） |
| `.claude/skills/task-specification-creator/references/resource-map.md` | UT-17 ワークフロー root + Phase 12 outputs 参照を monitoring 欄に追加 |

## Step 1-B：実装状況テーブル更新

| 項目 | 値 |
| --- | --- |
| 旧ステータス | `spec_created` |
| 新ステータス | `implementation_completed_external_ops_pending` |
| 反映先 | `docs/30-workflows/ut-17-cloudflare-analytics-alerts/index.md`、unassigned-task 系 index、artifacts.json phase-12 |
| 補足 | external ops（T1/T2/T8/T9/T10）完了かつ Phase 13 PR 完了時点で `completed` に更新し completed-tasks へ移動 |

## Step 1-C：関連タスク備考更新

| 関連タスク | 備考更新内容 |
| --- | --- |
| **UT-08-IMPL**（WAE custom alerts） | UT-17 で Cloudflare native usage alert と Slack JP relay は完了。WAE custom alerts は引き続き UT-08 スコープ。relay endpoint / payload schema は独立 |
| **UT-14**（WAF / Rate Limiting） | UT-17 relay Worker `/internal/alert-relay` は public endpoint。UT-14 で WAF レート制限ルールを設定し、cf-webhook-auth 検証前段の bot/spam 防御層を追加する |
| **UT-18**（Workers CPU time） | UT-17 の 4 metric には Workers CPU time を含めなかった。UT-18 で CPU time 取得・閾値・アラート手順を整備し relay Worker への合流可否を判定 |

## Step 2：システム仕様更新判定

| 判定項目 | 結論 |
| --- | --- |
| 新規インターフェース追加 | **あり** — `POST /internal/alert-relay`（cf-webhook-auth 検証必須、内部用途） |
| 既存インターフェース変更 | なし |
| 新規定数 / 設定値 | あり — `CF_WEBHOOK_AUTH_SECRET` / `SLACK_WEBHOOK_URL` / `CF_ALERT_DASHBOARD_URL` / `CF_ALERT_RUNBOOK_URL`、Notification Policy 4 種（Workers / D1 / Pages / R2）の 80% 閾値 |
| 反映先 | `aiworkflow-requirements/references/deployment-cloudflare.md`（Notification Policy 設定値）、`references/api-surface.md`（存在する場合 internal route を追記）、`indexes/keywords.json` / `topic-map.md` |
| 結論 | **Step 2 実施**（aiworkflow-requirements に internal route + Notification Policy 値を反映） |
| 再判定条件 | UT-08-IMPL / UT-14 / UT-18 実装時に route surface・metric セット・WAF ルールを再評価 |
