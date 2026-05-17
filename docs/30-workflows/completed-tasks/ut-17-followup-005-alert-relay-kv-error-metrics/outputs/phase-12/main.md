# Phase 12 main — UT-17-FU-005 正本同期入口

## 概要

UT-17-FU-005「alert-relay KV 操作エラーの observability 計測（構造化ログ emit）」の
Phase 1〜11 成果物を、ドキュメント正本群へ反映する Phase 12 の入口ドキュメント。

- 対象タスク: docs/30-workflows/ut-17-followup-005-alert-relay-kv-error-metrics
- 親タスク: UT-17-FU-002 (`apps/api` alert-relay dedup KV persistence)
- 後続タスク: UT-17-FU-006（KV usage dashboard 化）
- GitHub Issue: #701（CLOSED / completed marked / Issue close 時点では実コード未実装。本 workflow で local implementation と evidence を作成済み）

## 7 outputs 一覧

| # | output | 出力先 | 役割 |
| --- | --- | --- | --- |
| 1 | main.md | `outputs/phase-12/main.md` | 本ドキュメント（入口） |
| 2 | implementation-guide.md | `outputs/phase-12/implementation-guide.md` | PR 本文 / 技術契約の正本 |
| 3 | phase12-task-spec-compliance-check.md | `outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 strict compliance チェック表 |
| 4 | system-spec-update-summary.md | `outputs/phase-12/system-spec-update-summary.md` | システム仕様への影響記録 |
| 5 | skill-feedback-report.md | `outputs/phase-12/skill-feedback-report.md` | skill 群への feedback |
| 6 | unassigned-task-detection.md | `outputs/phase-12/unassigned-task-detection.md` | 検出された follow-up（UT-17-FU-006）|
| 7 | documentation-changelog.md | `outputs/phase-12/documentation-changelog.md` | ドキュメント変更履歴 |

## 重要契約サマリ

| 項目 | 値 |
| --- | --- |
| 構造化ログ `event` 固定文字列 | `"alert_relay_kv_op_failed"` |
| `op` 列挙 | `"get"` / `"put"` の 2 値 |
| `dedupeKeyHash` | SHA-256 first 12 hex chars |
| `isolateId` 採番位置 | module top で 1 回 |
| 出力経路 | `console.warn(JSON.stringify(payload))` |
| behaviour change | `KV.get` 失敗時の従来 unhandled → fail-open 化（意図的） |

## 次 Phase 引き継ぎ

Phase 13 `pr-summary.md` 作成 → user-gated で `gh pr create --base dev` 実行。
