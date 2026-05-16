# Phase 12 Main

判定: `completed (local unit + visual e2e evidence captured) / phase13_user_gated`

`apps/web/app/profile/_components/{VisibilityRequestDialog,DeleteRequestDialog}.tsx` は mutation success branch で `router.refresh() -> onSubmitted() -> onClose()` の順に実行する。`RequestActionPanel.tsx` は `router.refresh()` の重複発火点ではなく、accepted response を refresh 完了までの banner 表示橋渡しに限定する。

## Evidence

| 種別 | 結果 |
| --- | --- |
| typecheck | `pnpm typecheck` PASS |
| lint | `pnpm lint` PASS |
| focused unit | `pnpm --filter @ubm-hyogo/web test -- RequestActionPanel.component.spec.tsx` PASS（83 files / 561 tests, 1 skipped） |
| visual e2e | `pnpm --filter @ubm-hyogo/web test:e2e -- --project=desktop-chromium profile-state-sync-router-refresh.spec.ts` で screenshot 5 枚を `outputs/phase-11/screenshots/` に保存 |
| API / D1 / token | 変更なし |
