# Phase 8: リファクタリング

`[実装区分: 実装仕様書]`

## 8.1 変更テーブル（対象 / Before / After / 理由）

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| description id | static `density-${value}-desc`（`:64,79`） | `${uid}-density-${value}-desc`（`descId()` helper） | 複数配置衝突排除（AC-1）。helper 化で span と segmentedOptions の id 生成を単一ソース化 |
| `?` 表示 | 平文 `<span aria-hidden>?</span>`（`:87`） | `<Icon name="help" size="sm" />` | icon system 整合（AC-6）。重複しがちな簡易 markup を正本へ集約 |
| close 挙動 | native `<details>` 直書き | 非制御 `<details>` + `detailsRef` close effect | native summary toggle を維持しつつ Escape/click-outside を feature-local に集約 |

## 8.2 navigation / 重複の確認

- 新規 primitive を作っていないこと（`grep -rn "help-hint" apps/web/src` が DensityToggle と CSS のみ）。
- `descId` は component 内 local helper に留め、export しない（再利用境界を DensityToggle 内に固定）。
- `Segmented` / `Icon` は既存 export を変更しない（後方互換）。

## 8.3 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web lint
```

## 完了条件
- duplicate / drift がなく、責務境界が DensityToggle 内に閉じていること。
