---
実装区分: 実装仕様書
状態: implemented_local_evidence_captured
Phase: 12
作成日: 2026-05-29
task_id: sidebar-shell-visual-baseline-smoke-task-f
---

# Unassigned Task Detection

## 結論

本サイクルで Task F（+ 親 A-E）の実装本体・local evidence・文書 / 仕様書 / skill 同期は完了。新規の独立未タスクは 0 件。ただし CI 環境依存または親 workflow スコープのため本サイクルで完了不能な user-gated runtime ops / close-out 項目を 3 件明示する（起票要否はユーザー判断、最終レポートでエスカレーション）。

## 判定（実装完了後の再評価）

| Candidate | Decision | Reason |
| --- | --- | --- |
| Playwright spec / config / CI 実装 | DONE | 本ブランチで実装完了（local smoke 6/6 + visual V1-V3 green） |
| `data-testid` 契約の確定 | DONE | 実装で確定（`app-shell` / `shell-nav` / `shell-drawer` / `shell-collapse-toggle` / `shell-user-menu` / `shell-drawer-toggle`、spec と一致） |
| anonymous smoke/visual の `mockApi` 注入 | DONE | 本レビューで実バグ検出・修正（S1/S4/S5/S6・V1/V4/V6 の 7 ケース） |
| mobile viewport 375 vs fixture 390 統一 | resolved | 本 spec 専用 project の `use.viewport` で吸収（fixture 変更不要、phase-3 R3） |
| aiworkflow ledger / 仕様書 dangling 反映 | DONE | 本サイクルで lessons-learned / SKILL-changelog / 親 inventory path / patterns / specs（09h / 05-pages / 00-overview / 09g）を反映 |

## 本サイクルで完了不能（user-gated / 親スコープ — 起票要否はユーザー判断）

| 項目 | 不能理由（CONST_008 例外） | 実施場所 / 時期 |
| --- | --- | --- |
| CI Linux `-linux.png` baseline 撮影 + bot push + 空コミット再トリガー | 外部依存: CI Linux runner 必須。macOS local では正本 baseline を生成できない | Gate-B（PR 後の CI 実行 + user 承認） |
| visual regression dry-run（AC-6） | 上記 Linux baseline 確定後にのみ実施可能 | Gate-B（baseline commit 後） |
| 親 `unified-sidebar-shell` workflow_state 昇格 + Task A-F の completed-tasks 移動 | 親 workflow スコープ: 本サイクルは「Task F 文書のみ整合」の方針（ユーザー選択）。本実装と独立した大規模 close-out | 親 close-out wave |

## 注意

required status check PUT / commit / push / PR は Gate-C user-gated。上記 3 項目は「先送り（保守的に切る / 面倒）」ではなく、CI 環境・親 workflow スコープへの構造的依存に基づく（CONST_008 の未タスク化許容条件: 外部依存待ち / 本実装と独立した大規模スコープ）。最終レポートでユーザーにエスカレーションする。
