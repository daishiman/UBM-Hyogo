<!-- workflow: members-list-ux-clarity / task: A / phase: 8 -->

# Phase 8 — リファクタリング (task-a-density-toggle-ux-clarity)

[実装区分: 実装仕様書]

## 1. リファクタ対象

| 対象 | Before | After | 理由 |
| ---- | ------ | ----- | ---- |
| OPTIONS 配列 | DensityToggle 内で 3 箇所 (Segmented options / span / HelpHint items) に同じ description 文字列が散在 | OPTIONS 単一 const → map で 3 箇所派生 | DRY 維持 (Phase 5 設計で実装済の場合は no-op) |
| HelpHint key | `<Fragment key={label}>` の label をキーに使用 | label 重複の可能性が現状ないため許容 (将来重複可能性が出たら id field 追加) | YAGNI |
| Segmented sublabel 描画 | `{opt.sublabel ? <span>...</span> : null}` の三項 | `{opt.sublabel && <span>...</span>}` への置換は React warning 回避のため避ける | (no change) — 三項のまま維持 |
| `density-${value}-desc` id 生成 | リテラル文字列連結 | `useId()` への移行は同一ページ内複数 toggle 出現時のみ。現状は不要 | YAGNI (RA-4 で未タスク化検討) |

## 2. duplicate / navigation drift チェック

- `git grep -n "カード詳細\|カード簡易\|1行リスト" apps/web/src` を実行し description / sublabel リテラルが OPTIONS 1 箇所のみであることを確認
- `git grep -n "表示密度の説明を見る" apps/web/src` で triggerLabel が DensityToggle 1 箇所のみであることを確認
- `git grep -n "data-component=\"help-hint\"" apps/web` で HelpHint が DensityToggle 内のみで使用されていることを確認 (Task B / C で再利用される可能性は未来課題)

## 3. 抽出判断

| 候補 | 抽出する? | 理由 |
| ---- | --------- | ---- |
| OPTIONS const を別ファイル化 | No | DensityToggle 内 1 箇所のみ参照。抽出コスト > 価値 |
| HelpHint を `components/ui/` に昇格 | No | 本タスクは新 primitive 禁止 (INV-3)。MemberFilters 等で再利用要件が出た時点で別タスク化 |
| sr-only class を共通 utility 化 | 条件付き | 既存 `legacy-public.css` に `.sr-only` 定義が**ない**場合のみ追加。既存にあれば再利用 |

## 4. DoD

- [ ] OPTIONS が 1 箇所で定義され 3 箇所に map で派生していることを目視確認
- [ ] description / sublabel / triggerLabel リテラルが OPTIONS / triggerLabel const 以外に存在しない (`git grep` 確認)
- [ ] HelpHint が `components/public/` 配下に留まっている (INV-3)
- [ ] 既存 `.sr-only` 重複が発生していない
