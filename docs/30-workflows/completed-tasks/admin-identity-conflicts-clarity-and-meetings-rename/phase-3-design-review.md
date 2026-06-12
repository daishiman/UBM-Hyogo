# Phase 3 — 設計レビュー

## 目的

Phase 1-2 を 4 条件（価値性・実現性・整合性・運用性）で検証し、Phase 4 へ進めるか判定する。

## 成果物

- 4 条件評価・論点整理・MINOR 指摘（本ファイル）。

## 真の論点

1. 非エンジニア管理者が「会員の重複確認」画面で**何ができるか**を一目で理解し、安全に統合/別人確定できること。
2. それを**実データ無しでも体験**できる仮データ基盤を、本番を汚さず安全に用意すること。
3. API/D1 を変えずに（不変条件）UI 表現層と seed のみで完結すること。

## 4 条件評価（一次結論）

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | ✅ | 専門用語の壁を除去し、操作意図を平易化。仮データで操作を体験可能化。コストは表現層＋seed に限定。 |
| 実現性 | ✅ | 文言置換＋glossary/Guide 新設＋seed 生成は 1 サイクルで完了可能。検出ロジックは確認済で seed は条件を満たす。 |
| 整合性 | ✅ | API/D1/型 不変（adapter 層で吸収）。seed は専用 dataset で既存 test-accounts と分離。state machine 非変更。 |
| 運用性 | ✅ | seed は local/staging 限定＋scoped cleanup。contract test で drift 防止。gate（phase12-compliance / gate-metadata / tokens）整備。 |

## 因果ループ

- 強化ループ: 用語平易化 → 管理者の理解↑ → 操作の正確さ↑ → 重複データ整理が進む → 一覧の信頼性↑。
- バランスループ: 仮データ投入 → 候補が増える（学習用）↔ cleanup で撤去 → 本番品質を汚さない。

## 依存関係・責務境界の確認

- 表現層 → API は read-only fetch（既存 proxy）。glossary は表示最終段のみ。→ 境界クリーン。
- seed builder（apps/api/testing）は D1 へ直接書かず SQL を生成するだけ。適用は wrapper 経由。→ 不変条件 #5 整合。

## 価値とコストの不均衡

- 高コスト項目: seed builder + contract test（NON_VISUAL）。ただし test-accounts 先行実装の流用で実装コストは抑制。
- 将来層（スコープ外）: 第二段階検出（電話/住所）、3 件以上の一括統合 → API/D1 変更を伴うため分離（[unassigned-task-detection](./outputs/phase-12/unassigned-task-detection.md) baseline）。

## MINOR 指摘（未タスク化候補）

- M-1: 内部 member_id（TEST-MEM-xx）は非エンジニアには無意味。将来は氏名/職業を主表示にし ID を `<details>` 化する余地（本タスクでもラベル日本語化で一部対応。完全な ID 隠蔽は別タスク候補）。
- M-2: `/admin/meetings` ページ本体（カード/フォーム）の UX 改善は本タスク範囲外（サイドバー命名のみ）。

> M-1/M-2 は Phase 12 未タスク検出レポートに baseline 記録（本サイクル完了を破綻させないため分離。CONST_007 例外＝API/D1変更を伴う/独立スコープ）。

## 判定

**PASS** — Phase 4 へ進む。ブロッカーなし。

## 完了条件

- [ ] 4 条件すべて ✅。
- [ ] MINOR を未タスク baseline 化方針で記録。
- [ ] Phase 4 進行可否 = PASS。
