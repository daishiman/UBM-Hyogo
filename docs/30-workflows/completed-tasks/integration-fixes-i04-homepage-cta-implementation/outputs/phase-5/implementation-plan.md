# Phase 5: 実装 (GREEN)

実装済みファイル:
- 新規: `apps/web/src/lib/constants/form.ts`
- 新規: `apps/web/src/components/public/CallToActionCTA.tsx`
- 編集: `apps/web/app/page.tsx`（import + mount）
- 編集: `apps/web/src/styles/legacy-public.css`（dark variant style）

検証結果:
- `pnpm exec vitest run apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx apps/web/src/lib/constants/__tests__/form.spec.ts` → 9 tests PASS
- `pnpm typecheck` PASS
- `pnpm lint` PASS
- `grep -nE '#[0-9a-fA-F]{3,8}' apps/web/src/styles/legacy-public.css | grep -i 'call-to-action'` → 0 件
- responderUrl 直書き grep → constants/form.ts と form.spec.ts の 2 件のみ
