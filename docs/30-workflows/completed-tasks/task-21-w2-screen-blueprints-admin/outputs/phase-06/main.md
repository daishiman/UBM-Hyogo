# Phase 6 — 実装本体 1（main.md）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | task-21-w2-screen-blueprints-admin |
| Phase | 6 / 13 |
| 種別 | docs-only / NON_VISUAL |
| 状態 | completed |
| 完了日 | 2026-05-07 |

## 目的

09g に §2 dashboard / §3 members を作成。pages-admin.jsx の凍結 prototype 構造 を構造 contract 転記し、§X.1〜X.8 のサブセクション 8 件を揃える。

## 成果物の所在

- 09g §2 dashboard（2.1〜2.8）
- 09g §3 members（3.1〜3.8）

## 実施内容

### §2 dashboard

- 2.1 route `/admin` 概要
- 2.2 layout / JSX（pages-admin.jsx Dashboard ブロック転記）
- 2.3 状態遷移 mermaid（loading → success / error）
- 2.4 API 表（phase-3 §2 admin block の dashboard 行と完全一致）
- 2.5 データ表示（KPI カード / recent activity）
- 2.6 a11y（該当 confirm 操作なしの画面注記）
- 2.7 操作手順（読み取り専用）
- 2.8 参照リンク（09c / 09b / 09d / 09a）

### §3 members

- 3.1 route `/admin/members` 概要
- 3.2 layout / JSX（Members ブロック転記）
- 3.3 状態遷移 mermaid（loading → success → confirming → applied、bulk-action 経路含む）
- 3.4 API 表（list / detail / bulk-update / approve / reject）
- 3.5 データ表示（列：name / email / status / tags / actions）
- 3.6 a11y: bulk-action confirm Modal `role="dialog"` `aria-modal="true"` focus trap Esc close
- 3.7 操作手順: bulk-select → action select → confirm Modal → submit → toast
- 3.8 参照リンク

## DoD 充足 evidence

| AC | 観測 | 結果 |
| --- | --- | --- |
| AC-4 | §2 / §3 で各 8 サブセクション = 16 | GREEN（partial, 64 達成は phase-08 で完了） |
| AC-6 | §2.4 / §3.4 が phase-3 §2 と一致 | GREEN（partial） |
| AC-7 | §3.6 confirm Modal 4 文字列出現 | GREEN（+1 件） |

## Phase 7 への引き継ぎ

- §4 tags / §5 meetings / §6 schema の作成
- §6.3 mermaid に二段確認パスを必ず明示

## 次 Phase

Phase 7（実装本体 2）— §4 / §5 / §6 を追加。
