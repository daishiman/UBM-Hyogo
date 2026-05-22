# Phase 5 — TDD GREEN（main.md）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | task-21-w2-screen-blueprints-admin |
| Phase | 5 / 13 |
| 種別 | docs-only / NON_VISUAL |
| 状態 | completed |
| 完了日 | 2026-05-07 |

## 目的

09g に §1 AdminSidebar 共通セクションを 1 箇所に集約して作成し、AC-2（Sidebar 1 箇所のみ）を最初に GREEN にする。各画面 §X 冒頭の「Sidebar は §1 参照」link 集約も同時に確立する。

## 成果物の所在

- 09g §1 AdminSidebar（1.1 JSX / 1.2 nav 表 / 1.3 active state / 1.4 token 参照）
- §2〜§9 各冒頭の sidebar back-reference 8 件

## 実施内容

1. 既存 09g の §X 各画面に散在していた Sidebar 記述を削除し §1 へ統合
2. §1.1 に凍結 prototype 構造 を構造 contract 転記
3. §1.2 に nav 表（label / route / icon / active 条件）を作成
4. §1.3 に active state 判定ルール（pathname 前方一致）
5. §1.4 に token 参照を `--ubm-*` 名のみで記述（視覚値 0 件）
6. §2〜§9 各冒頭に「Sidebar は §1 参照」link を 8 件配置

## DoD 充足 evidence

| AC | 観測 | 結果 |
| --- | --- | --- |
| AC-2 Sidebar 1 箇所 | grep `^## 1\. AdminSidebar` = 1 | GREEN |
| sidebar_refs | §2〜§9 から §1 へ link = 8 | GREEN |

Phase 11 evidence: `structure.json.sidebar_count = 1`, `sidebar_refs = 8`。

## Phase 6 への引き継ぎ

- §2 dashboard / §3 members の凍結 構造 contract 転記
- §X.4 API 表の phase-3 §2 完全一致
- §X.6 a11y 文字列の必須記述

## 次 Phase

Phase 6（実装本体 1）— §2 dashboard / §3 members の本体を作成。
