# Phase 12: unassigned-task-detection.md

日付: 2026-04-28

## 方針

「0 件で済ませない」運用ルールに従い、本タスクから派生する未割当タスク候補を A（open / 本タスクで未完）、B（resolved-in-wave）、C（baseline）の区分で記録する。

## A. open — 本タスクで未完のもの

### A-1. ADR テンプレート標準化

| 項目 | 内容 |
| --- | --- |
| 派生元 | 本タスク（ADR-0001 初版執筆を通じて見えた構造化要望） |
| 概要 | 今回 ADR-0001 で確立した必須セクション（Status / Context / Decision / Consequences / Alternatives Considered / References + 派生元抜粋）を `doc/decisions/TEMPLATE.md` として標準化し、`doc/decisions/README.md` から参照させる。本タスクは「初版を作る」スコープに留め、テンプレート抽出は別タスク |
| 推奨 owner | platform / devex |
| 推奨 taskType | docs-only |
| 想定スコープ | `doc/decisions/TEMPLATE.md` 1 本 + README.md への参照リンク追加 |
| 優先度 | Low（ADR-002 以降を作る前に着手で十分） |
| 状態 | formalized（`docs/30-workflows/unassigned-task/task-adr-template-standardization.md`） |

### A-2. lefthook 運用ガイドから ADR-0001 への参照追加

| 項目 | 内容 |
| --- | --- |
| 派生元 | 30種思考法レビュー（正本リンクの双方向性） |
| 概要 | `doc/00-getting-started-manual/lefthook-operations.md` の関連リンクまたは方針節から ADR-0001 へ参照を追加し、運用者が hook 方針の設計判断へ辿れるようにする |
| 推奨 owner | platform / devex |
| 推奨 taskType | docs-only |
| 想定スコープ | `lefthook-operations.md` への1リンク追加 + ADR/運用ガイド間リンク検証 |
| 優先度 | Low（現行運用と矛盾はないため、次回運用ガイド更新時でよい） |
| 状態 | unassigned（正本運用ガイド更新を伴うため本タスクでは保留） |

## B. resolved-in-wave — 本タスク内で対応済み

### B-1. 派生元 phase-2/design.md と phase-3/review.md からの ADR 化バックリンク追加

| 項目 | 内容 |
| --- | --- |
| 派生元 | 派生元 task-git-hooks-lefthook-and-post-merge Phase 12 unassigned-task-detection B-2 |
| 状態 | resolved-in-wave（Phase 5 runbook Step 4 で実施済み） |

## C. baseline — 既存だが未対応の関連候補

該当なし（本タスクのスコープに直接関係する baseline 候補は本 wave 内で発見されなかった）。

## サマリ

| 区分 | 件数 |
| --- | --- |
| A. open | 2（A-1: ADR テンプレート標準化、A-2: lefthook 運用ガイドから ADR-0001 への参照追加） |
| B. resolved-in-wave | 1 |
| C. baseline | 0 |
| 合計 | 3 |

A-1 は formalize 済み。A-2 は本タスク完了後の任意フォローアップで、`docs/30-workflows/unassigned-task/` への正式タスク化は本タスクのスコープ外（追加作業を発生させないため、本ファイルの記録のみで足りるという判断）。
