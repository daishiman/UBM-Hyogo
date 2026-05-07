# Phase 4 — TDD RED（main.md）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | task-21-w2-screen-blueprints-admin |
| Phase | 4 / 13 |
| 種別 | docs-only / NON_VISUAL |
| 状態 | completed |
| 完了日 | 2026-05-07 |

## 目的

Phase 3 で定義した gate が「09g 不在時」または「AC 未充足時」に確実に fail することを確認する。docs-only タスクのため code テストは存在しない。代わりに gate スクリプトの fail simulation を行い、それが Phase 5 以降の GREEN へ遷移する起点であることを記録する。

## RED simulation 結果（P50 baseline 観測）

| AC | RED 観測（repair 前） | 期待 fail 種別 | 結果 |
| --- | --- | --- | --- |
| AC-1 行数 | 1779 行（上限 1200 超過） | range fail | RED |
| AC-2 Sidebar 1 箇所 | §1 含め複数画面で再記述あり（drift 候補） | grep > 1 | RED |
| AC-3 top section 数 | 9 + §99 不採用が欠落 | count != 10 | RED |
| AC-4 sub section 64 | 派生 4 画面で X.1〜X.8 不揃い | count < 64 | RED |
| AC-5 視覚値 0 件 | HEX / px が複数残存 | grep > 0 | RED |
| AC-6 API parity | §X.4 が phase-3 §2 と乖離 | diff > 0 | RED |
| AC-7 a11y 4 文字列 | focus trap / Esc close 欠落画面あり | grep < 7 | RED |
| AC-8 二段確認 mermaid | §6.3 に diff→confirming→applied 不在 | grep miss | RED |
| AC-9 不採用 3 件 | §99 不採用セクション無し | grep miss | RED |

## fail シミュレーション（仮想 09g 不在 ケース）

```
$ wc -l docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md
wc: ...: No such file or directory
$ grep -c '^## 1\. AdminSidebar' ... → fail
```

→ 全 gate が non-zero exit / 件数 0 で fail することを確認。

## DoD 充足 evidence

- 全 9 AC が RED 状態であることを上記表で記録
- GREEN への移行条件は Phase 5（§1）以降の追記・修正で達成する

## Phase 5 への引き継ぎ

- §1 AdminSidebar 集約セクションの作成（最初の GREEN 候補）
- 視覚値除去 / Sidebar 重複削除 / §99 追加 を順次達成

## 次 Phase

Phase 5（TDD GREEN）— §1 AdminSidebar セクションを作成して AC-2 を最初に GREEN へ。
