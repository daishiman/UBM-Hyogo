---
workflow_id: issue-265-forms-api-quota-sa-governance
phase: 6
taskType: docs-only
visualEvidence: NON_VISUAL
state: spec_created
---

# Phase 6 — 依存タスク連携

## 1. UT-08（監視・アラート設計）への連動

| 連動項目 | 本 spec 側 | UT-08 側 |
| --- | --- | --- |
| quota 使用率の閾値 | 70% 連続 2 週間（AC-3 trigger） | 監視ダッシュボードのアラート閾値として転記 |
| metric source | `apps/api/src/jobs/sync-forms-responses.ts:460` の `QUOTA` カテゴリ | Cloudflare logs から集計 |
| 通知先 | （UT-08 側で確定） | Slack / メール |

UT-08 着手時に本 spec の `outputs/phase-11/project-switch-trigger.md` を引用し、閾値設計に転記する。本 spec は **閾値の根拠ドキュメント** として機能する。

## 2. UT-25（Cloudflare Secrets / SA JSON deploy）連動

| 連動項目 | 本 spec 側 | UT-25 側 |
| --- | --- | --- |
| Secret キー名 | `GOOGLE_SERVICE_ACCOUNT_JSON`（runbook 雛形に明記） | secret put 実施対象 |
| 配置コマンド | `bash scripts/cf.sh secret put` を runbook で固定 | 実値投入の責務 |
| rotation 手順 | runbook 7 章で記述 | 実施作業 |

## 3. UT-09 / UT-21（旧 Sheets→D1 同期ジョブ実装）

UT-09 / UT-21 は Forms API 移行後 closed / 不要化されている可能性が高い。連動は **none**（参照のみ）。

## 4. 完了済タスクへの後方参照

| 参照先 | 本 spec での扱い |
| --- | --- |
| `completed-tasks/01c-parallel-google-workspace-bootstrap/` | 「SA / OAuth client 発行元」として読み取り専用参照 |
| `completed-tasks/ut-03-sheets-api-auth-setup/` | CLOSED。本 spec は申し送り先消失に対する standalone 代替 |
| `completed-tasks/03a-parallel-forms-*` / `03b-parallel-forms-*` | 同期ジョブ確定値の参照元 |

## 5. 新規 unassigned task の発行

**なし**（Phase 12 unassigned-task-detection.md に「0 件」と明記）。
