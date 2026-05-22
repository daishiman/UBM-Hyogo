# Phase 1 — 要件定義（main.md）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | task-21-w2-screen-blueprints-admin |
| Phase | 1 / 13 |
| 種別 | docs-only / NON_VISUAL |
| 状態 | completed |
| 完了日 | 2026-05-07 |
| 前 Phase | なし |
| 次 Phase | 2（設計） |

## 入力

- 元仕様: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-21-w2-par-screen-blueprints-admin.md`
- 凍結正本: `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx`（L1-L658）
- 上流 phase-1 §3（admin route 一覧） / phase-3 §2 §3 §5.3〜§5.7（API + 派生ルール）

## 出力サマリ

- AC-1〜AC-9 を quantitative に確定
- 真の論点 5 件 / 4 条件評価
- P50 baseline 記録（既存 09g を検出 → repair 路線で確定）
- Phase 2 open question 引き継ぎ

## P50 baseline 結果

`09g-screen-blueprints-admin.md` は P50 時点で existing。新規作成路線ではなく **既存 09g の contract repair** として Phase 5〜10 を実行する方針を確定。元行数（P50）から目標行数（700〜1200）への圧縮計画は Phase 2 で詳述する。

## AC（Acceptance Criteria）

| ID | 期待値 | 検証手段 |
| --- | --- | --- |
| AC-1 | `09g` 行数 700〜1200 | `wc -l` |
| AC-2 | `^## 1\. AdminSidebar` が 1 箇所のみ | grep |
| AC-3 | top section 数 = 9 + §99 = 10 | grep `^## [0-9]+\. ` |
| AC-4 | §2〜§9 各 8 サブセクション計 64 | grep `^### [2-9]\.[1-8] ` |
| AC-5 | 視覚値 grep（HEX / OKLch 直値 / ピクセル値 / 任意値クラス記法）が 0 件 | grep |
| AC-6 | phase-3 §2 admin API と §X.4 が完全一致（行 diff 0） | diff |
| AC-7 | confirm Modal a11y 4 文字列が該当画面 §X.6 に出現 | grep（`role="dialog"` / `aria-modal="true"` / focus trap / Esc close） |
| AC-8 | §6.3 mermaid に diff → confirming → applied 二段パス | grep |
| AC-9 | §99 不採用 3 件（TweaksPanel / theme switcher / data-theme） | grep |

## 真の論点 5 件（決定記録）

1. **AdminSidebar 集約粒度** — 採用: §1 を 1.1〜1.4 の 4 サブセクションに分割（JSX / nav 表 / active state / token 参照）。各画面 §X 冒頭は「Sidebar は §1 参照」へ link 集約。不採用: 各画面で再記述する案（重複と drift 不可避）。
2. **未掲載 4 画面の派生ルール表現** — 採用: phase-3 §5.x を 09g に正本転記し、§ 冒頭に `> 派生元: phase-3 §3 §5.x` を必須付与。不採用: link のみ（09g 単独着手不能）／抜粋＋link（drift 経路が 2 本になる）。
3. **a11y 記述粒度** — 採用: 各画面 §X.6 に `role="dialog"` `aria-modal="true"` focus trap Esc close を必須記述。共通定義は 09c primitive（task-19）への link で担保。
4. **schema-apply 二段確認の記述位置** — 採用: §6.3 mermaid と §6.7 操作手順の **両方** で表現（片方欠落で AC-8 fail）。
5. **視覚値 0 件の判定基準** — 採用: Tailwind utility（`bg-white` 等）は primitive class として保持し、任意値クラス記法 / OKLch 直値 / ピクセル値などの生値のみ禁止。grep gate で 0 件判定。

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | task-15/16/17 が 09g 単独で着手可能 |
| 実現性 | PASS | 凍結 prototype 構造 658 行 + 派生 4 画面を 906 行（後の Phase 11 実測値）に収まることを Phase 2 で再検証 |
| 整合性 | PASS（gate 必要） | Phase 11 で行 diff 0 確認 |
| 運用性 | PASS（gate 必要） | grep gate + structure check |

## DoD 充足 evidence

- AC-1〜9 quantitative: 上記表
- 論点 5 件 + 不採用案: 上記
- 4 条件評価: 根拠記入済
- Phase 2 open question: 下記

## Phase 2 への open question / 引き継ぎ

- 章立て最終確定（§1〜§9 + §99）
- 派生ルール抜粋粒度（全文転記 + 派生元注記の方針で確定済）
- §X.7 操作手順テンプレートの統一形（bulk-action / approve-reject / schema-apply の 3 系統）
- §X.4 API 表の列構成（method / endpoint / 用途 / status code）
- mermaid 配置箇所（§X.3 状態遷移 8 件 = 各画面 1 件）

## 次 Phase

Phase 2（設計）— 章立てとシグネチャ、派生ルール正本転記計画を確定する。
