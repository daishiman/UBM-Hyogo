# Phase 8 — リファクタリング (task-01)

## 結論

**対象なし。**

## 理由

本タスクは PR #795 後の CI failure を**最小変更**で解消することを目的としている (SCOPE.md §不変条件 1)。`setup-project` composite は他の 8 caller (default 引数) が依存しており、より広範なリファクタ (e.g. `mise` 経路の cache 統一・全 caller への明示 `cache` 引数化) を本 PR に含めると以下の副作用が発生する。

| リファクタ候補 | 副作用 | 判定 |
| -------------- | ------ | ---- |
| 全 caller を明示 `cache: 'pnpm'` 化 | diff 規模拡大、レビュー範囲が CI failure 修正を超える | 見送り |
| `mise` 経路にも `cache` input を統一 | `jdx/mise-action` の `cache:` 入力意味が異なる (binary cache) ため概念混乱 | 見送り |
| `install` input を boolean 型に矯正 | YAML composite action は string 型のみサポート | 不可 |
| `setup-strategy` の deprecate (`node-setup` 一本化) | 他コンシューマー調査が必要、別タスク | 見送り |

## 将来課題 (本 PR 対象外)

| ID | 内容 |
| -- | ---- |
| FUTURE-01 | `setup-project` の input 仕様書化 (`README.md` 追加) |
| FUTURE-02 | `mise` 経路の cache 戦略統一 |

これらは別 issue として登録するが本 PR では追加しない。
