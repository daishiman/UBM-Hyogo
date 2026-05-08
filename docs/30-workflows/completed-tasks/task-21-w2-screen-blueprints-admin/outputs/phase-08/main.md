# Phase 8 — 実装本体 3（main.md）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | task-21-w2-screen-blueprints-admin |
| Phase | 8 / 13 |
| 種別 | docs-only / NON_VISUAL |
| 状態 | completed |
| 完了日 | 2026-05-07 |

## 目的

09g に §7 requests / §8 identity-conflicts / §9 audit（派生 3 画面）と §99 不採用 3 件を追加し、AC-3 / AC-4 / AC-9 を全 GREEN にする。

## 成果物の所在

- 09g §7 requests（7.1〜7.8）派生元: phase-3 §5.4
- 09g §8 identity-conflicts（8.1〜8.8）派生元: phase-3 §5.5
- 09g §9 audit（9.1〜9.8）派生元: phase-3 §5.7
- 09g §99 不採用要素（TweaksPanel / theme switcher / data-theme）

## 実施内容

### §7 requests

- 派生注記必須
- 7.6 a11y: approve / reject confirm Modal の 4 文字列必須
- 7.7 操作手順: approve-reject 二段確認

### §8 identity-conflicts

- 派生注記必須
- 8.6 a11y: merge / split confirm Modal の 4 文字列必須
- 8.7 操作手順: compare → 選択 → merge confirm

### §9 audit

- 派生注記必須
- timeline 表示・filter
- 9.6 a11y: 該当 confirm 操作なしの注記（read-only）
- 9.7 操作手順: filter / export

### §99 不採用要素

- TweaksPanel — token 動的編集機能（運用混乱のため）
- theme switcher — light/dark UI 切替（OKLch token 一本化のため）
- data-theme attribute — HTML 属性切替（CSS variable で代替）

## DoD 充足 evidence

| AC | 観測 | 結果 |
| --- | --- | --- |
| AC-3 | top section 数 = 10 | GREEN |
| AC-4 | 64 サブセクション完了 | GREEN |
| AC-7 | confirm Modal 4 文字列が累計 7 件画面で出現 | GREEN |
| AC-9 | §99 に 3 件列挙 | GREEN |
| derive_notes | §5 / §7 / §8 / §9 で 4 件 | GREEN |

## Phase 9 への引き継ぎ

- 行数 1779 → 906 への圧縮（重複除去・冗長記述削除）
- sidebar 参照 link 8 件の文言統一

## 次 Phase

Phase 9（リファクタ）— 重複除去 / 行数調整 / 文言統一。
