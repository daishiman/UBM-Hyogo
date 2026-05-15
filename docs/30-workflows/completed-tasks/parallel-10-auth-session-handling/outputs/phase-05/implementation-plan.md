# Phase 5 — Implementation Plan

## 変更対象ファイル

| パス | 種別 | 概要 |
| --- | --- | --- |
| `apps/web/src/features/admin/hooks/useAdminMutation.ts` | 新規 | mutation 共通 hook 実装 |
| `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.tsx` | 新規 | hook unit test (6 ケース) |
| `apps/web/src/features/admin/hooks/index.ts` | 新規 | barrel export |
| `apps/web/src/components/ui/Toast.tsx` | 編集 | variant 引数追加・alert 用 aria-live="assertive" 領域追加 |
| `apps/web/src/components/ui/Toast.spec.tsx` | 新規 | variant 別描画 test |
| `apps/web/src/lib/fetch/authed.spec.ts` | 既存維持 | 5 ケース網羅済み |
| `apps/web/src/lib/url/login-redirect.spec.ts` | 既存維持 | 5 ケース網羅済み |

## 関数シグネチャ（決定値）

Phase 02 hook-design.md / toast-extension-design.md と同一。

## 入出力・副作用

Phase 02 error-handling-matrix.md と同一。

## DoD

1. `mise exec -- pnpm typecheck` exit 0
2. `mise exec -- pnpm lint` exit 0
3. `mise exec -- pnpm --filter @ubm-hyogo/web test` exit 0 (566 passed / 1 skipped)
4. `mise exec -- pnpm --filter @ubm-hyogo/web build` exit 0
5. AC-1〜AC-9 すべて PASS
6. `outputs/phase-11/evidence/` に 4 ログ保存
7. Phase 12 必須 7 ファイル生成
