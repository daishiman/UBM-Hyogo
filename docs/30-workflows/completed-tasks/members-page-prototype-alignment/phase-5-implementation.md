# Phase 5: 実装手順（ファイル別 diff 方針）

> 本 Phase は実装者（後続エージェント or 人間）への作業指示。コードの実行は本ワークフローのスコープ外（CONST_002）だが、後続が迷わず着手できる粒度で記述する。

## 1. 作業順序

1. `Segmented` primitive 拡張（必要時）
2. `DensityToggle.client.tsx` 書換
3. `MemberFilters.client.tsx` DOM 調整
4. `MemberCard.tsx` / `MemberGrid.tsx` density propagation 確認
5. `MemberTable.tsx` 構造調整
6. `legacy-public.css` 末尾追記
7. テスト追加 / 既存テスト assertion 更新
8. typecheck / lint / build / test 通す

## 2. ファイル別変更

### 2.1 `apps/web/src/components/ui/Segmented.tsx`

| 操作 | 内容 |
|---|---|
| 確認 | 現行 props が `value` / `options` / `onChange` を持つか / `data-*` と `aria-label` を root に渡せるか |
| 編集 | 必要なら component signature を `({ value, options, onChange, ariaLabel, ...rest })` に拡張し root の `<div>` に `aria-label={ariaLabel}` と `{...rest}` を spread。`role="radiogroup"` を root に明示 |

### 2.2 `apps/web/src/components/public/DensityToggle.client.tsx`

[phase-2-design.md §1.1](phase-2-design.md) のコード片に置換。既存 FormField / RadioGroup / Input 依存を完全に削除。

### 2.3 `apps/web/src/components/public/MemberFilters.client.tsx`

- 最外コンテナを `<form role="search" aria-label="メンバー絞り込み" data-component="member-filters">` に統一
- 内側を `<div data-role="filter-grid">` で grid 化（CSS が並び付与）
- クリアボタンを `<button type="button" data-role="clear">` に統一
- 既存の URL sync ロジック / `useMemberFilters` 等の hook 接続は維持

### 2.4 `apps/web/src/components/public/MemberCard.tsx`

[phase-2-design.md §1.3](phase-2-design.md) の構造に合わせる。`data-density` を必ず付与。

### 2.5 `apps/web/src/components/public/MemberGrid.tsx`

最外を `<ul data-component="member-grid" data-density={density}>` に変更（`<li>` 配列で MemberCard を包む）。

### 2.6 `apps/web/src/components/public/MemberTable.tsx`

`<table data-component="member-table">` 直下に `<thead>` / `<tbody>` を配置。各 `<tr>` 内の `<td>` 列順をプロトタイプ準拠（avatar / name+occupation / zone+status / location / chevron）に整列。

### 2.7 `apps/web/src/components/feedback/EmptyState.tsx`

- root 要素に `data-component="empty-state"` `role="status"` を確実に付与
- 中央寄せ用に内部 `<div data-role="icon">` / `<p data-role="message">` / CTA button を構造化

### 2.8 `apps/web/src/styles/legacy-public.css`

ファイル末尾 `@layer components { ... }` ブロック**内**（既存ブロックを閉じている場合は新規 `@layer components { ... }` で再オープン）に [phase-2-design.md §2](phase-2-design.md) の CSS を追記。既存ルールは編集しない。

### 2.9 `apps/web/app/(public)/members/page.tsx`

- page-head の markup を `<header className="page-head">` ＋ `<div><div className="eyebrow">MEMBERS</div><h1>メンバー一覧</h1><p data-role="lead">...</p></div><DensityToggle value={density} />` 構造に整える
- 既存の Server Component / searchParams / fetch ロジックは変更しない

## 3. ローカル実行・検証コマンド

```bash
# 開発サーバ起動（別タブ）
mise exec -- pnpm --filter @ubm-hyogo/web dev

# 並列で品質ゲート
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web build
mise exec -- pnpm --filter @ubm-hyogo/web test -- --run

# token verify (CI gate と同等)
mise exec -- pnpm verify:tokens
# または web package の focused gate:
mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens

# 手動: http://localhost:3000/members を 3 density × 2 viewport で目視確認
```

## 4. 想定差分サイズ

- 編集ファイル: ~8 ファイル
- 新規ファイル: 1〜2（Playwright smoke spec + MemberCard.spec.tsx）
- LOC 増減: +400 / -150 程度

## 5. 完了条件 (DoD)

- 上記 9 ファイルの編集 / 新規が完了
- `pnpm typecheck` / `pnpm lint` / `pnpm build` exit 0
- 追加した spec が pass
- `rg "bg-\[#" apps/web/src` と `rg "#[0-9a-fA-F]{6}" apps/web/src --type tsx --type css` で新規 0 件（既存はそのまま）
- `rg "data-component=\"public-header\"" apps/web/src` / `"public-footer"` / `"density-toggle"` / `"member-filters"` / `"member-table"` がそれぞれ 1 件以上ヒット
- localhost で 3 density × 2 viewport の目視 OK
