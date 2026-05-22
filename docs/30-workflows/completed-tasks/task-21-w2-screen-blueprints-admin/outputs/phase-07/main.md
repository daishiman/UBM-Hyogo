# Phase 7 — 実装本体 2（main.md）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | task-21-w2-screen-blueprints-admin |
| Phase | 7 / 13 |
| 種別 | docs-only / NON_VISUAL |
| 状態 | completed |
| 完了日 | 2026-05-07 |

## 目的

09g に §4 tags（凍結 prototype 構造）/ §5 meetings（派生）/ §6 schema（凍結 prototype 構造 + 二段確認）を作成。

## 成果物の所在

- 09g §4 tags（4.1〜4.8）
- 09g §5 meetings（5.1〜5.8、派生元注記必須）
- 09g §6 schema（6.1〜6.8、6.3 に二段確認 mermaid）

## 実施内容

### §4 tags（凍結 prototype 構造 転記）

- CRUD: list / create / edit / delete
- 4.6 a11y: delete confirm Modal の 4 文字列必須
- 4.7 操作手順: 削除二段確認

### §5 meetings（派生）

- 冒頭注記: `> 派生元: phase-3 §3 §5.3（meetings — list/create/edit/cancel queue 派生）`
- 5.6 a11y: cancel confirm Modal の 4 文字列必須
- 5.7 操作手順: queue cancel パターン
- 新 primitive 生成なし

### §6 schema（二段確認）

- 6.2 layout: diff preview パネル + apply ボタン
- 6.3 mermaid:
  ```
  diff --> confirming: apply requested
  confirming --> applied: apply success
  applied --> loading: refresh
  ```
- 6.6 a11y: apply confirm Modal の 4 文字列必須
- 6.7 操作手順: 差分確認 → apply → confirm Modal → 適用

## DoD 充足 evidence

| AC | 観測 | 結果 |
| --- | --- | --- |
| AC-4 | §4 / §5 / §6 で 24 サブセクション追加（累計 40） | GREEN（partial） |
| AC-7 | §4.6 / §5.6 / §6.6 で 4 文字列追加 | GREEN（累計 4 件） |
| AC-8 | §6.3 mermaid に diff→confirming→applied | GREEN |

## Phase 8 への引き継ぎ

- §7 / §8 / §9 派生 3 画面 + §99 不採用 3 件

## 次 Phase

Phase 8（実装本体 3）— 残り §7 §8 §9 §99 を追加し AC-3 / AC-4 / AC-9 を全 GREEN へ。
