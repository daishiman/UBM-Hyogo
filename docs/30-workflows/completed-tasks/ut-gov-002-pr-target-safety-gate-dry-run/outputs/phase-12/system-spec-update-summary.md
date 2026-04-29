# Phase 12: システム仕様書更新サマリー (system-spec-update-summary)

task-specification-creator skill の Phase 12 Step 1-A〜1-D および Step 2 判定を記録する。

## Step 1-A: 完了タスク記録

UT-GOV-002 を `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/` 配下に `spec_created` として記録した。
親タスク `task-github-governance-branch-protection` の Phase 12 unassigned-task-detection で検出された **U-2** を正式仕様化したもの。

- 親タスク参照: `docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-12/unassigned-task-detection.md`
- 検出根拠: 親タスクで `pull_request_target` の safety gate 草案 (Phase 2 §6) は完了したが、dry-run / security review は scope 外で別 PR が必要と判定された。

## Step 1-B: 実装状況

| 項目 | 状態 | 備考 |
| --- | --- | --- |
| 仕様書作成 | `spec_created` | 13 Phase + outputs 完了 |
| 実 workflow 編集 | 含まない | 後続 UT-GOV-002-IMPL（別 PR） |
| dry-run 実走 | 含まない | 後続 UT-GOV-002-IMPL |
| security review 本適用 | 含まない | 後続 UT-GOV-002-SEC |
| GitHub Issue | #145（CLOSED のまま）| Issue ライフサイクルと仕様作成を切り離す（index.md Decision Log 参照） |

## Step 1-C: 関連タスク更新

| タスク | 関係 | 必要な更新 |
| --- | --- | --- |
| `task-github-governance-branch-protection` | 上流（必須） | なし（completed-tasks 配下、本タスクが U-2 を formalize したことの参照のみ追加可能） |
| `UT-GOV-001-github-branch-protection-apply` | 上流前提 | なし |
| `UT-GOV-007-github-actions-action-pin-policy` | 上流前提 | なし |
| UT-GOV-003〜006 | 並列 governance タスク | なし（互いに独立） |
| 後続 UT-GOV-002-IMPL / -SEC / -OBS | 下流 | unassigned-task-detection.md で起票方針を提示 |

既存の `docs/30-workflows/completed-tasks/UT-GOV-002-pr-target-safety-gate-dry-run.md` は、旧形式の proposed メモとして残す。本タスクの正本は Phase 1-13 を備えた `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/` であり、後続実装は本ディレクトリの outputs を input とする。

## Step 1-D: 上流 runbook 差分追記タイミング

判定: **Wave N+1 実装 PR で追記**。

理由:

- 本タスクは仕様策定に閉じるため、上流 runbook（`docs/00-getting-started-manual/...`）の差分は発生しない。
- 実 workflow 編集を行う後続 UT-GOV-002-IMPL タスクで、運用ランブック（仮: `docs/01-infrastructure-setup/github-actions-safety.md`）の差分を一括追記する設計とする。
- 本タスク内では `outputs/phase-5/runbook.md` に dry-run 手順を閉じ込め、上流 spec への波及は意図的に保留する。

## Step 2: aiworkflow-requirements 正本仕様更新の要否判定

判定: **N/A**

### 判定根拠

| 観点 | 影響有無 | 説明 |
| --- | --- | --- |
| API endpoint | 影響なし | Hono route の追加・変更なし |
| D1 schema | 影響なし | migration なし |
| IPC 契約 | 影響なし | apps/web ↔ apps/api 間の DTO 変更なし |
| UI ルート / 画面 | 影響なし | apps/web 配下の変更なし |
| auth フロー | 影響なし | Auth.js / Google OAuth / Magic Link の変更なし |
| Cloudflare Secrets / Variables | 影響なし | secrets binding の追加・rotate なし |
| ランタイム定数 | 影響なし | フォーム固定値（formId 等）への影響なし |

本タスクは GitHub Actions governance に閉じる仕様策定であり、`docs/00-getting-started-manual/specs/` 以下の正本仕様に影響を与えない。
CLAUDE.md のブランチ戦略・solo CI gate 方針が既存の governance 前提を満たしているため、追加更新は不要。

### 想定される将来の更新トリガ

以下が発生した場合のみ Step 2 を `実施` に切り替える:

1. safety gate が `OIDC token` を発行する設計に変更され、Cloudflare 側で audience 検証が必要になる場合
2. `workflow_run` イベント経由で apps/api / apps/web のデプロイ権限を grant する設計に変更される場合
3. PR triage の判定条件に D1 / KV のメタデータを参照する場合

いずれも本タスク非対象であり、UT-GOV-002-IMPL / -OBS で発生時に再判定する。

## BLOCKED 判定の有無

なし（Step 1-A〜1-D, Step 2 すべて記録完了）。

## 結論

| Step | 判定 |
| --- | --- |
| 1-A | 実施（記録完了） |
| 1-B | 実施（spec_created で固定） |
| 1-C | 実施（関連タスク 4 種を整理） |
| 1-D | 実施（Wave N+1 実装 PR に追記時期を明確化） |
| 2 | **N/A**（理由: 正本仕様への影響なし） |
