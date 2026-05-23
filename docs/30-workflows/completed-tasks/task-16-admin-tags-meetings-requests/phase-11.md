# Phase 11: VISUAL_ON_EXECUTION Evidence Plan

> 改訂日: 2026-05-10
> 状態: `pending_user_approval`

## 1. Boundary

本 turn では runtime browser / staging smoke は実行しない。visual evidence は user approval 後に取得する。仕様書パッケージとしては capture plan、canonical filename、pending marker を配置済みにする。

## 2. P-16 Scenarios

| ID | route | screenshot |
| --- | --- | --- |
| P-16-01 | `/admin/tags` | `outputs/phase-11/screenshots/admin-tags-queue.png` |
| P-16-02 | `/admin/meetings` | `outputs/phase-11/screenshots/admin-meetings-table.png` |
| P-16-03 | `/admin/meetings` modal/edit state | `outputs/phase-11/screenshots/admin-meetings-edit.png` |
| P-16-04 | `/admin/requests?type=visibility_request` | `outputs/phase-11/screenshots/admin-requests-visibility.png` |
| P-16-05 | `/admin/requests?type=delete_request` | `outputs/phase-11/screenshots/admin-requests-delete.png` |

## 3. Command

```bash
PLAYWRIGHT_ADMIN_REQUESTS_FIXTURE=1 mise exec -- pnpm -F @ubm-hyogo/web test:e2e -- --grep "admin"
```

## 4. Current evidence state

`PENDING_RUNTIME_EVIDENCE`: runtime screenshot / axe / staging smoke は user approval 後。
