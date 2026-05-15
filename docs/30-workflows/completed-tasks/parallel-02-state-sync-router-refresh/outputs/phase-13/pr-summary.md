# PR Summary

判定: `blocked_pending_user_approval`

Phase 13 は commit / push / PR 作成の user gate で停止する。PR 本文の正本はこのファイルと `outputs/phase-12/implementation-guide.md`。

## Summary

- `VisibilityRequestDialog` / `DeleteRequestDialog` の mutation success branch で `router.refresh()` を `onSubmitted` / `onClose` より先に呼ぶ。
- `RequestActionPanel` は parent 側の重複 refresh を持たず、accepted response を次の server snapshot までの bridge state として使う。
- 409 duplicate は既存 pending を示す API contract として扱い、refresh なしで bridge banner と重複エラーを表示する。

## Test Plan

- `pnpm --filter @ubm-hyogo/web test -- RequestActionPanel.component.spec.tsx`
- `pnpm --filter @ubm-hyogo/web test -- VisibilityRequestDialog.component.spec.tsx`
- `pnpm --filter @ubm-hyogo/web test -- DeleteRequestDialog.component.spec.tsx`
- `pnpm --filter @ubm-hyogo/web test:e2e -- --project=desktop-chromium profile-state-sync-router-refresh.spec.ts`
- `pnpm typecheck`
- `pnpm lint`

## Screenshot Evidence

- `docs/30-workflows/parallel-02-state-sync-router-refresh/outputs/phase-11/screenshots/01-profile-initial.png`
- `docs/30-workflows/parallel-02-state-sync-router-refresh/outputs/phase-11/screenshots/02-visibility-dialog-open.png`
- `docs/30-workflows/parallel-02-state-sync-router-refresh/outputs/phase-11/screenshots/03-visibility-banner-shown.png`
- `docs/30-workflows/parallel-02-state-sync-router-refresh/outputs/phase-11/screenshots/04-delete-dialog-confirmed.png`
- `docs/30-workflows/parallel-02-state-sync-router-refresh/outputs/phase-11/screenshots/05-delete-banner-shown.png`

## User Gate

コミット、push、PR 作成は未実行。ユーザーの明示指示後に実施する。
