# Phase 5 実装サマリ — step-07-requests-approve-reject

## 変更概要

| Path | 種別 | 内容 |
|---|---|---|
| `apps/web/src/components/admin/RequestQueuePanel.tsx` | modify | state 圧縮 / useConfirmDialog 統合 / 409 + 404 handler / detail と dialog を子 component に委譲 |
| `apps/web/src/components/admin/RequestQueueDetail.tsx` | add | presentational detail view（approve/reject button + 詳細 dl） |
| `apps/web/src/components/admin/RequestConfirmDialog.tsx` | add | HTML5 `<dialog>` wrapper / FormField 経由 textarea / destructive 警告 / validation |

## hook 利用

- `useAdminMutation`（`@/features/admin/hooks/useAdminMutation`） — CLAUDE.md 不変条件 #10 準拠。`refreshOnSuccess: false` で内部 refresh を抑制し、panel 側で 200/409/404 各分岐ごとに `router.refresh()` を呼ぶ。
- `useConfirmDialog` — open/kind/context を管理。submit/validation は dialog 側に委譲（dialog が自前で note state を持つため、hook の `submit()` は no-op）。

## 不変条件チェック

- [x] HEX 直書きなし（`verify-design-tokens` green）
- [x] `process.env.*` 直接参照なし
- [x] D1 直接アクセスなし（`resolveAdminRequest` 経由）
- [x] FormField 経由（dialog 内 textarea）
- [x] `*.spec.tsx` 拡張子のみ追加

## ローカル実行結果

| コマンド | 結果 |
|---|---|
| `pnpm exec vitest run RequestQueueDetail RequestConfirmDialog RequestQueuePanel.component` | 23 / 23 pass |
| `pnpm exec vitest run primitive-adoption` | 23 / 23 pass |
| `pnpm -F web typecheck` | 0 error |
| `pnpm -F web lint` | 0 error |
| `tsx scripts/verify-design-tokens.ts` | drift 0（88 tracked） |
