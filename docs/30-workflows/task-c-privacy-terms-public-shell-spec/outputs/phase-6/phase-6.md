# Phase 6 — テスト拡充

## 1. 目的

Phase 4 の基本ケースに加え、回帰検出力を高めるための追加 assertion / edge ケースを spec へ追補する。

## 2. 追加ケース

### `apps/web/app/privacy/__tests__/page.spec.tsx`

| ID | ケース | 期待 |
|----|-------|------|
| C2-fail-closed | `getAuthView()` が reject | レンダーが throw せず、guest 相当 UI（`data-auth-state="guest"`）が描画される（Task A 内部の fail-closed に依存） |
| C2-body-preserved | LegalProse 本文 6 セクションが全て描画 | `screen.getByRole("heading", { level: 2, name: "1. 取得する情報" })` 等、全 h2 が存在 |
| C2-back-link | トップに戻るリンク存在 | `screen.getByRole("link", { name: "トップに戻る" })` href `"/"` |
| C2-grid-class | grid layout class 存在 | container `<div>` が `grid-rows-[auto_1fr_auto]` を含む |

### `apps/web/app/terms/__tests__/page.spec.tsx`

terms 用に同型の C2-fail-closed / C2-body-preserved（terms 本文の主要 h2）/ C2-back-link / C2-grid-class を追加。

## 3. snapshot は使わない

shell 構造は data-attribute / role で固定し、HTML snapshot は LegalProse 本文の偶発差分でノイズが乗るため不採用。

## 4. mock 補強

`PublicHeader` / `PublicFooter` は実体描画のため Task A の出力 contract に依存。Task A 側の data-attribute（`data-component="public-header"`, `data-auth-state`, `data-role`）が変わった場合は本 spec も追随して更新する。

## 5. 実行確認

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  app/privacy/__tests__/page.spec.tsx \
  app/terms/__tests__/page.spec.tsx
```

両 spec の全ケースが pass すること。
