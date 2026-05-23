# Phase 11 manual-test / 視覚的検証

## 実施区分

`visualEvidence: NON_VISUAL`（index.md メタ情報）。本タスクは admin/requests panel の振る舞い refactor であり、デザイントークン・primitive・layout を変更しない。視覚的回帰はないため screenshot 取得は行わない。

## 代替検証

- vitest 23 / 23 pass で UI 振る舞い（list / detail / dialog / 409 toast / pagination / disabled state）を回帰検査済み
- `primitive-adoption.spec.ts` で EmptyState / Pagination / useAdminMutation / 生 `<input>` 不在 の構造制約を grep 検査済み
- `verify-design-tokens` drift 0 で token literal の意図せぬ追加なし

## 視覚要素一覧（コード上の確認）

| 要素 | 描画ファイル | 備考 |
|------|-------------|------|
| dialog body | `RequestConfirmDialog.tsx` | `<dialog>` 標準スタイル + `data-destructive` attribute hook |
| destructive 警告 | `RequestConfirmDialog.tsx` | `<p role="alert">` |
| approve/reject button | `RequestQueueDetail.tsx` | プレーン `<button type="button">` |

スタイル指定は token 化済みグローバル CSS に依存。新規 inline color は導入していない。
