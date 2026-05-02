# テスト戦略 — TC一覧

## API route (`apps/api/src/routes/admin/requests.test.ts`)

| TC | シナリオ | 期待 |
|----|----------|------|
| TC-01 | 未認証で叩く | 401 |
| TC-02 | visibility_request 一覧 FIFO | 古い順 2 件、resolved は除外 |
| TC-03 | query 不正（type 未知） | 400 |
| TC-04 | visibility approve | `member_status.publish_state` が desiredState に更新 / note resolved |
| TC-05 | delete approve | `member_status.is_deleted=1` + `deleted_members` 1 行 |
| TC-06 | reject | `member_status` 不変 / note rejected / body 末尾に `[rejected]` 付与 |
| TC-07 | visibility approve 後の query | resolved は pending 一覧に出ない |
| TC-08 | 二重 resolve | 1 回目 200 / 2 回目 409 |
| TC-09 | resolutionNote > 500 文字 | 400 |
| TC-10 | 未知 noteId | 404 |
| TC- (extra) | visibility approve で `desiredState` 不正 | 422 |

## Repository (`apps/api/src/repository/__tests__/adminNotes.test.ts`)

| TC | シナリオ | 期待 |
|----|----------|------|
| RP-1 | listPendingRequests FIFO | type+status 絞り、`(created_at ASC, note_id ASC)` |
| RP-2 | cursor pagination | limit=2 で 1page=2件 + nextCursor / 2page=残り1件 + null |

## Web (`apps/web/src/components/admin/__tests__/RequestQueuePanel.test.tsx`)

| TC | シナリオ | 期待 |
|----|----------|------|
| TC-21 | 初期表示 | `依頼キュー` heading / 一覧描画 / payload 要約 |
| TC-22 | 承認ボタン | confirmation dialog open |
| TC-23 | delete_request 承認 | `論理削除` 警告 alert |
| TC-25 | 409 応答 | 「他の管理者が既に処理済み」toast |
| TC-PII | raw email 渡しても DOM に出ない | DOM に `raw@example.com` なし |

## 手動 smoke (Phase 11)
- queue 表示 / approve（visibility）/ approve（delete）/ reject — 各 1 シナリオずつ
