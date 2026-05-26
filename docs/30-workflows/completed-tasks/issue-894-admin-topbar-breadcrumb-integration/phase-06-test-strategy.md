# Phase 6: Test Strategy

## 1. Overview

本タスクは UI 配線のため、Unit + Integration（layout spec）+ a11y + Playwright screenshot の 4 層で検証する。page-local breadcrumb の root label 除去は grep gate で全 consumer を閉じる。

## 2. Unit (primitive)

### 2.1 Breadcrumb.spec.tsx

- `apps/web/src/components/admin/__tests__/Breadcrumb.spec.tsx` を追加し、primitive の最小契約を固定する。
- 確認契約:
  - `items` が空配列のとき `null` を返す
  - 最終 item に `aria-current="page"` が付与される
  - 最終 item は href 付きでも current span として描画される
  - `data-component="breadcrumb"` を持つ `<nav>` を出力する
  - `ui-breadcrumb` class が付与される

### 2.2 AdminPageHeader（影響評価）

- breadcrumbs を「現在地のみ」に変えても title / actions / description の描画契約が崩れないことを既存 spec で確認。
- AdminPageHeader 自体の実装は変えないため、新規 spec 追加は不要。

## 3. Integration (layout)

### 3.1 layout.spec.tsx 追記

`apps/web/app/(admin)/layout.spec.tsx` に以下 assertion を追加（Phase 5 §5.1 参照）:

- `data-component="admin-breadcrumb-slot"` の **内側に** `data-component="breadcrumb"` が出現
- slot 内の current label が textContent `"管理"` を持ち、`href="/admin"` link を持たない

### 3.2 既存 data-* 契約

以下が引き続き pass することを確認:

- `[data-route-group="admin"]`
- `[data-route="admin"]`
- `[data-theme="cool"]`
- `[data-testid="admin-shell"]`
- `[data-shell="topbar"]`
- `[data-component="admin-breadcrumb-slot"]`

## 4. 重複検出（「管理」ラベル）

代表 page（dashboard / members）の統合描画で:

```
queryAllByText("管理") → 1 件（topbar slot 内のみ）
```

であることを目視 or 統合 spec で確認。

## 5. a11y

- `axe` critical violation 0 を維持。
- `<nav aria-label="breadcrumb">` ランドマークが 2 つ（topbar / page header）存在することを許容。
  - WCAG 上、複数 `aria-label` 付き landmark は識別可能であれば許容される。
  - 万一 axe が duplicate landmark warning を出す場合は、AdminPageHeader 側の `aria-label` を `"breadcrumb (page)"` に区別する対応を Phase 9 risks の予備策として残す（本タスク既定では対応不要）。

## 5.1 Runtime screenshot

- Playwright authenticated admin fixture で `/admin` を開き、topbar slot 内に `Breadcrumb` primitive と current label「管理」が見えることを screenshot で確認する。
- 保存先: `outputs/phase-11/screenshots/admin-dashboard-breadcrumb-desktop.png`

## 6. 検証コマンド

```bash
# layout integration spec
mise exec -- pnpm --dir apps/web exec vitest run "app/(admin)/layout.spec.tsx"

# Breadcrumb primitive spec
mise exec -- pnpm exec vitest run "apps/web/src/components/admin/__tests__/Breadcrumb.spec.tsx"

# 型 / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 重複ラベル grep（仕様準拠の検出）
grep -rn 'label: "管理"' "apps/web/app/(admin)/admin/" || echo "0 件（期待値）"
```

## 7. テスト suffix 規約

- 既存 spec は `*.spec.tsx` 形式を維持（CLAUDE.md 不変条件8）。
- 新規 `*.test.tsx` ファイルを作らない（lefthook / GitHub Actions が reject）。
