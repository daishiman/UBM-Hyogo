# Phase 12 outputs — main

## ステータス

- 状態: spec_created（実 smoke 未実施 / system spec 実更新は pending）

## Phase 12 出力ファイル一覧（必須 7 ファイル）

| # | ファイル | 役割 |
| --- | --- | --- |
| 1 | `main.md`（本ファイル） | Phase 12 出力の index |
| 2 | `implementation-guide.md` | Part 1 中学生レベル + Part 2 技術者レベル解説 |
| 3 | `system-spec-update-summary.md` | system spec 更新対象と pending 状態の明示 |
| 4 | `documentation-changelog.md` | 本タスクで更新したドキュメント一覧 |
| 5 | `unassigned-task-detection.md` | 未タスク検出レポート（0 件でも必須） |
| 6 | `skill-feedback-report.md` | skill への feedback（改善点なしでも必須） |
| 7 | `phase12-task-spec-compliance-check.md` | 7 ファイル実体存在の compliance check |

## サマリ

- 本タスクは Issue #273（CLOSED）由来の苦戦箇所を仕様書化するのみで、Issue を再オープンしない。
- system spec への実反映（`15-infrastructure-runbook.md` 等）は Phase 11 実 smoke 完了後に別 PR で実施する。
- changelog 段階は `spec_created` で固定し、smoke 後に `executed` ステータスへ昇格する 2 段階運用とする。

## 不変条件 trace

- 不変条件 #5（apps/web からの D1 直接アクセス禁止）を本タスク全体で再確認。
- 不変条件 #6（GAS prototype 非昇格）を smoke 経路の対象外として明記。

## 次フェーズへの引き継ぎ

- Phase 13 `change-summary.md` に本 phase 7 ファイル + Phase 11/13 ファイルを列挙する。
- PR 本文は `Refs #273` 表記固定。
