# Phase 11 Visual Evidence

判定: `completed`

Local unit evidence と Playwright screenshot evidence を取得する。スクリーンショットは mock API + member session fixture を使い、D1 / 外部 API へ接続しない。

## Selector Contract

`RequestPendingBanner` は `role="status"` / `aria-live="polite"` / `data-pending-type` を持つ。Playwright では存在しない `data-region="request-pending-banner"` を使わず、次を canonical selector とする。

| Scenario | Selector |
| --- | --- |
| visibility banner | `page.getByRole("status").filter({ hasText: "公開状態の変更申請" })` または `[data-pending-type="visibility_request"]` |
| delete banner | `page.getByRole("status").filter({ hasText: "退会申請" })` または `[data-pending-type="delete_request"]` |

## Captured Screenshots

- `outputs/phase-11/screenshots/01-profile-initial.png`
- `outputs/phase-11/screenshots/02-visibility-dialog-open.png`
- `outputs/phase-11/screenshots/03-visibility-banner-shown.png`
- `outputs/phase-11/screenshots/04-delete-dialog-confirmed.png`
- `outputs/phase-11/screenshots/05-delete-banner-shown.png`

## Command

```bash
pnpm --filter @ubm-hyogo/web test:e2e -- --project=desktop-chromium profile-state-sync-router-refresh.spec.ts
```
