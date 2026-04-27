# workflow inventory: UT-08 モニタリング/アラート設計

`docs/30-workflows/completed-tasks/ut-08-monitoring-alert-design/` の成果物 inventory と SSOT、派生未タスク、関連リンクを集約する。Wave 2 以降の実装で本ファイルから入力 SSOT を辿れるようにする。

## ワークフロー概要

| 項目 | 値 |
| --- | --- |
| ID | UT-08 |
| 種別 | design / non_visual / spec_created |
| ディレクトリ | `docs/30-workflows/completed-tasks/ut-08-monitoring-alert-design/` |
| 状態 | spec_created（Phase 1-12 完了、Phase 13 PR 作成は本作業では実施せず） |
| 上流 | `docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/` |
| 下流 | `docs/30-workflows/unassigned-task/UT-08-IMPL-monitoring-alert-implementation.md`（Wave 2 実装） |

## Phase 別成果物リスト

### Phase 1 - 要件定義

- `outputs/phase-01/requirements.md` — Cloudflare Analytics / WAE / 外部監視 / 通知の要件と無料枠前提

### Phase 2 - 設計（SSOT 群）

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-02/monitoring-design.md` | 総合まとめ（AC-1〜AC-7 をリンクで束ねる） |
| `outputs/phase-02/metric-catalog.md` | Workers / Pages / D1 / Cron のメトリクスカタログ |
| `outputs/phase-02/alert-threshold-matrix.md` | WARNING / CRITICAL の閾値マトリクスと根拠 |
| `outputs/phase-02/notification-design.md` | Slack Webhook / Email fallback / dedupe / aggregation の通知設計 |
| `outputs/phase-02/external-monitor-evaluation.md` | UptimeRobot 等の外部監視ツール評価 |
| `outputs/phase-02/wae-instrumentation-plan.md` | WAE binding / dataset / イベント / フィールド / sampling の SSOT |
| `outputs/phase-02/runbook-diff-plan.md` | 05a runbook（observability-matrix / cost-guardrail-runbook）への差分追記方針 |
| `outputs/phase-02/failure-detection-rules.md` | D1 クエリ失敗・Sheets→D1 同期失敗の検知ルール |
| `outputs/phase-02/secret-additions.md` | 追加 Secret 一覧（1Password Environments 経由） |

### Phase 3 - 設計レビュー

- `outputs/phase-03/design-review.md` — GO / NO-GO 判定

### Phase 4 - テスト計画

- `outputs/phase-04/test-plan.md` — 検証項目とテスト戦略

### Phase 5 - 実装計画

- `outputs/phase-05/implementation-plan.md` — Wave 2 実装の前提条件と段取り

### Phase 6 - 異常系検証

- `outputs/phase-06/failure-case-matrix.md` — 想定失敗ケースと検知ルールの対応

### Phase 7 - AC traceability

- `outputs/phase-07/ac-traceability-matrix.md` — AC-1〜AC-11 と成果物の trace

### Phase 8 - 設定 DRY 化

- `outputs/phase-08/refactoring-log.md` — 重複排除と SSOT 化の記録

### Phase 9 - 品質保証

- `outputs/phase-09/quality-checklist.md` — 品質確認項目

### Phase 10 - 最終レビュー

- `outputs/phase-10/go-nogo-decision.md` — 最終 GO 判定（MINOR 6 件追跡）

### Phase 11 - 手動 smoke テスト（NON_VISUAL）

- `outputs/phase-11/main.md` — Phase 11 サマリ
- `outputs/phase-11/manual-smoke-log.md` — 自動チェック 4 種 PASS 記録
- `outputs/phase-11/link-checklist.md` — リンクチェック（FAIL 0 / PASS_WITH_OPEN_DEPENDENCY 2 件）

### Phase 12 - ドキュメント更新（close-out）

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-12/main.md` | Phase 12 サマリ |
| `outputs/phase-12/implementation-guide.md` | Wave 2 実装ガイド（Part 1 中学生レベル + Part 2 技術者レベル） |
| `outputs/phase-12/documentation-changelog.md` | workflow-local + global skill sync の差分記録 |
| `outputs/phase-12/system-spec-update-summary.md` | spec_created close-out（Step 1-A〜1-C / Step 2 の実施記録） |
| `outputs/phase-12/skill-feedback-report.md` | スキル改善提案 5 件（template / workflow / document） |
| `outputs/phase-12/unassigned-task-detection.md` | 派生未タスク 9 件（current 5 / baseline 4） |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 Task 1-6 の準拠確認 |

## SSOT クイック参照

実装者が Wave 2 で参照する SSOT を以下から辿る:

```
implementation-guide.md（Part 2）
  ├─ wae-instrumentation-plan.md   ← binding / dataset / event / field
  ├─ alert-threshold-matrix.md      ← WARNING / CRITICAL 閾値
  ├─ notification-design.md         ← Slack Webhook / Email / dedupe
  ├─ failure-detection-rules.md     ← D1 / 同期失敗の検知ルール
  ├─ secret-additions.md            ← Secret 名と 1Password Environments
  └─ runbook-diff-plan.md           ← 05a runbook 差分追記方針
```

## 派生未タスク

| ID | 内容 | 推奨 Wave |
| --- | --- | --- |
| UT-08-IMPL | モニタリング/アラート実装（WAE 計装・アラートワーカー・通知・UptimeRobot） | Wave 2 |
| UT-30 | 05a outputs 個別ファイル生成 | Wave 2 直前 |
| UT-31 | モニタリング月次運用化（CRITICAL 段階導入） | Wave 2 完了後 |

## 関連リンク

- 上流タスク: `docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/`
- 派生実装タスク: `docs/30-workflows/unassigned-task/UT-08-IMPL-monitoring-alert-implementation.md`
- 元未タスク: `docs/30-workflows/unassigned-task/UT-08-monitoring-alert-design.md`
- 苦戦箇所と知見: `lessons-learned-ut08-monitoring-design-2026-04.md`
- Cloudflare 連携詳細: `deployment-cloudflare.md`
- Secret 取り扱い: `deployment-secrets-management.md`
- Phase 11 NON_VISUAL ルール: `task-specification-creator/SKILL.md` UBM-002 / UBM-003
