# Phase 7 — レビュー観点

reviewer がチェックする 6 観点。

## R-1: diff scope の最小性

- 変更が `apps/web/src/components/admin/` + `apps/web/src/styles/tokens.css` + `apps/web/app/(admin)/admin/tags/page.tsx`（最小）に閉じている
- `apps/api/*` / `packages/shared/*` / `migrations/*` / D1 schema に diff が無い
- `apps/web/src/lib/admin/api.ts` の `resolveTagQueue` helper は **温存**（削除は後続 task）

## R-2: 不変条件 #13 への適合

- UI 層の mutation が BFF `POST /api/admin/tags/queue/:queueId/resolve` のみ（upstream は `POST /admin/tags/queue/:queueId/resolve`）
- `tagQueueResolveBodySchema` で client / server 二重検証
- `resolveTagQueue` の直接呼び出し箇所が 0（`rg "resolveTagQueue\(" apps/web/src/components` で 0 件）

## R-3: a11y

- `role="dialog"` + `aria-modal="true"` が drawer に付与
- focus trap + ESC close + return focus が動作
- terminal status item で submit が `aria-disabled="true"`
- form error が `aria-describedby` で関連付け
- axe-core violations が 0

## R-4: design token 使用

- 新規 / 変更ファイルに HEX (`#xxxxxx`) / `bg-[#...]` / `text-[#...]` が含まれない
- status badge color は `var(--status-*-bg)` 経由
- `verify-design-tokens` gate（task-18）pass

## R-5: mutation 経路と UX

- `useAdminMutation` 経由（busy guard / toast / router.refresh 統一）
- 二重 submit 防止が hook の `isSubmittingRef` で担保
- success / error の toast 文言が confirmed / rejected で区別
- `successMessage` mapper によって `idempotent: true` は「既に処理済です」と表示される
- idempotent: true 時の UX が「既に処理済」を示すメッセージで分岐（Phase 8 risk 参照）

## R-6: no-D1 change / no-endpoint change

- `apps/api/src/routes/admin/tags-queue.ts` 未編集
- migration 追加なし
- `tagQueueResolveBodySchema` 未編集

## カバレッジ局所視点

変更したファイル（`TagsQueueResolveDrawer.tsx`, `_tagQueueStatus.ts`, `TagQueuePanel.tsx` の差分部）は line / branch とも 100% を目標。広域 coverage 目標は適用しない（局所変更の保護に絞る）。
