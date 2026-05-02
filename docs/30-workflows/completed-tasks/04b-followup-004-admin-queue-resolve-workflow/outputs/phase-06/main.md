# Phase 6 — Web UI 実装記録

## 追加・変更ファイル

| ファイル | 種別 | 概要 |
|----------|------|------|
| `apps/web/app/(admin)/admin/requests/page.tsx` | new | server component。`fetchAdmin<AdminRequestsApiResponse>` で `/admin/requests?status=pending&type=...` を取得し RequestQueuePanel に渡す |
| `apps/web/src/components/admin/RequestQueuePanel.tsx` | new | client component。type タブ / 一覧 / 詳細 / approve・reject confirmation modal / 409 toast / `router.refresh()` |
| `apps/web/src/lib/admin/api.ts` | edit | `resolveAdminRequest(noteId, body)` を追加（`/api/admin/requests/:noteId/resolve` POST） |
| `apps/web/src/components/layout/AdminSidebar.tsx` | edit | nav に `/admin/requests` 「依頼キュー」を追加 |
| `apps/web/src/components/admin/__tests__/RequestQueuePanel.test.tsx` | new | TC-21/22/23/25 + PII テスト |

## UI 実装ポイント
- type タブ（visibility_request / delete_request）→ `router.push(?type=...)` で server fetch を再実行
- detail panel に `noteId / 会員 / 種別 / 提出日時 / 理由 / 依頼内容 / 状態` を dl 表示
- payload は `summarizePayload`（`desiredState` 抽出 / fallback で JSON.stringify）でユーザに見せる
- confirmation modal は `role="dialog" aria-modal="true"`
  - delete_request approve: 「論理削除されます」`role="alert"` 警告
  - visibility_request approve: 「公開状態を変更します」案内
- resolutionNote textarea は max 500 文字、PII 注意ラベル
- 409: 「他の管理者が既に処理済みです」`role="status"` toast + `router.refresh()`
- ネットワークエラー: `処理に失敗しました: <error>` toast 表示

## 不変条件確認
- ✅ #5: server-fetch / mutation はすべて admin proxy `/api/admin/*` 経由
- ✅ raw PII 値は表示しない（`summarizePayload` が `desiredState` のみ拾う or `JSON.stringify` だが API 側で sanitize 済み）

## テスト結果
- 5 tests PASS
