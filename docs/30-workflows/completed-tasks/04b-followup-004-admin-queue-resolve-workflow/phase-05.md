# Phase 5: API / repository 実装

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 04b-followup-004-admin-queue-resolve-workflow |
| Phase 番号 | 5 / 13 |
| Phase 名称 | API / repository 実装 |
| 作成日 | 2026-05-01 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (Web UI 実装) |
| 状態 | completed |

## 目的

`admin_member_notes` の `note_type='visibility_request'` / `'delete_request'` 依頼を admin が pickup / resolve するための一覧 API と resolve API を追加し、`member_status` 更新と note 更新を D1 transaction で atomic に実行する。

## 実行タスク

1. `apps/api/src/repository/adminNotes.ts` の既存 `markResolved` / `markRejected` を活用し、`listPendingRequests({ status, type, limit, cursor })` を追加する
2. `apps/api/src/repository/status.ts`（または既存 helper）に `updatePublishState(memberId, publishState)` / `markDeleted(memberId)` を必要分だけ追加する
3. `apps/api/src/routes/admin/requests.ts` を新設し、`GET /admin/requests` と `POST /admin/requests/:noteId/resolve` を実装する
4. resolve route は D1 の実環境で rollback を実測できる transaction strategy で `member_status` 更新 + `admin_member_notes.request_status='resolved'|'rejected'` + audit metadata 書き込みを atomic に行う
5. `apps/api/src/index.ts` または admin router mount に新 route を登録する
6. query / body validation（zod）、`requireAdmin` gate、resolution 列挙（`approve` / `reject`）、二重 resolve の冪等または 409 を実装する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Repository | apps/api/src/repository/adminNotes.ts | `markResolved` / `markRejected` 既存 helper |
| Migration | apps/api/migrations/0007_admin_member_notes_request_status.sql | `request_status` / `resolved_at` / `resolved_by_admin_id` 列 |
| Existing route | apps/api/src/routes/admin/members.ts | admin gate / response shape の先例 |
| Admin mount | apps/api/src/index.ts | route 登録 |
| Spec | docs/00-getting-started-manual/specs/07-edit-delete.md | visibility / delete の状態遷移 |

## 実行手順

### ステップ 1: repository

`listPendingRequests` は `request_status='pending'` と `note_type IN (...)` で filter し、`created_at ASC, note_id ASC` で order する（古い依頼から処理する FIFO）。bind parameter のみを使い、文字列連結禁止。`markResolved` / `markRejected` は既に audit metadata（`resolved_at`、`resolved_by_admin_id`、`resolutionNote`）を書く形を再利用し、本タスクで signature 変更しない。

### ステップ 2: route

`requireAdmin` を必ず通し、`SYNC_ADMIN_TOKEN` 系統と混ぜない。`POST /admin/requests/:noteId/resolve` の body は `{ resolution: 'approve' | 'reject', resolutionNote?: string }`。invalid query / body は 400、非 admin は既存 middleware と同じ 401/403 に揃える。`noteId` 不在は 404。

### ステップ 3: atomic transaction

approve 分岐:

- `note_type='visibility_request'` のとき、依頼内容（payload）から目的の `publish_state` を取り出し、`member_status.publish_state` を更新する
- `note_type='delete_request'` のとき、`member_status.is_deleted=1` を立てる
- 同 transaction scope 内で `admin_member_notes.request_status='resolved'` と audit metadata を書く

reject 分岐:

- `member_status` は変更しない
- `admin_member_notes.request_status='rejected'` と audit metadata だけを書く

いずれか 1 statement が失敗したら全体 rollback。実装時は D1 の実 API / local test double の双方で partial commit が発生しないことを fault injection で確認し、`outputs/phase-09/main.md` に証跡を残す。

### ステップ 4: 二重 resolve の扱い

`request_status` が `pending` 以外の note への `resolve` 呼び出しは **409 Conflict** で拒否する。冪等にしたい場合でも response body で「既に resolved/rejected 済み」を明示し、`member_status` を二度更新しないことを最優先にする。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | TC-01〜TC-08 を満たす（一覧・approve・reject・atomic・409） |
| Phase 6 | Web admin queue UI が読む response contract |
| Phase 9 | api typecheck / vitest / contract test |

## 多角的チェック観点（AIが判断）

- 不変条件 #4（admin-managed data 分離）を遵守し、依頼内容（payload）と決定（resolution）の責務を混ぜない
- 不変条件 #5（D1 アクセスは apps/api 限定）を守り、`apps/web` から直接 D1 を叩かない
- approve 時の `publish_state` 算出ロジックは、依頼 payload 信頼ではなく「受理可能な状態遷移」を server side で再検証する
- delete_request approve は **論理削除**のみ。物理 DELETE は本タスクのスコープ外

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | listPendingRequests repository | pending | FIFO order |
| 2 | GET /admin/requests | pending | requireAdmin |
| 3 | POST /admin/requests/:noteId/resolve | pending | approve/reject 分岐 |
| 4 | D1 transaction strategy | pending | rollback 実測必須 |
| 5 | route tests | pending | Phase 4 TC |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | API 実装記録 |
| コード | apps/api/src/repository/adminNotes.ts | `listPendingRequests` 追加 |
| コード | apps/api/src/routes/admin/requests.ts | 新 route |
| コード | apps/api/src/index.ts | route mount |

## 完了条件

- [ ] `GET /admin/requests` が admin gate 配下で動く
- [ ] `POST /admin/requests/:noteId/resolve` の approve / reject 分岐が機能する
- [ ] `member_status` 更新 + note 更新が D1 transaction strategy で atomic
- [ ] 二重 resolve が 409 で拒否される
- [ ] route / repository tests が PASS

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] main.md 配置
- [ ] artifacts.json の Phase 5 を completed に更新

## 次Phase

次: 6 (Web UI 実装)。
