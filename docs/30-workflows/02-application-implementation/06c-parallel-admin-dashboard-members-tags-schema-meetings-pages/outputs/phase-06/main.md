# Phase 6: 異常系検証

| 異常系 | 受信 | UI 挙動 | 実装位置 |
| --- | --- | --- | --- |
| 未認証で `/admin/*` | layout.tsx 内 `getSession()=null` | `redirect("/login?next=/admin")` | `app/(admin)/layout.tsx` |
| 非 admin で `/admin/*` | `session.isAdmin !== true` | `redirect("/login?gate=forbidden")` | 同上 |
| 非 admin が `/api/admin/*` proxy 直叩き | proxy 内 `requireAdmin()` で 403 | JSON 403 | `app/api/admin/[...path]/route.ts` |
| `GET /admin/dashboard` 5xx | `fetchAdmin` throw | `error.tsx` で再試行ボタン | `app/(admin)/admin/error.tsx` |
| `PATCH .../status` 4xx | `result.ok=false` | drawer 内に `role=alert` でメッセージ表示 | `MemberDrawer` |
| `POST .../tags/queue/:id/resolve` 409 (already resolved) | error.error="already resolved" | toast "解決に失敗: already resolved" | `TagQueuePanel` |
| `POST /admin/schema/aliases` 404 (question not found) | error 表示 | `setToast("失敗: ...")` | `SchemaDiffPanel` |
| `POST .../attendance` 422 (削除済み) | result.status=422 | toast "削除済み会員は登録できません" | `MeetingPanel` |
| `POST .../attendance` 409 (重複) | result.status=409 | toast "既に出席登録されています" + UI 側 disabled | `MeetingPanel` |
| network error | result.status=0 | toast にメッセージ | `lib/admin/api.ts` |

## 防御テスト

- `MeetingPanel.filterCandidates` の unit test で削除済み除外
- `lib/admin/api.ts` の export 集合 test で profile/tag 直接編集 mutation がないこと
- `MemberDrawer` の rendering test で profile 本文 input が **存在しない** ことを assertion
