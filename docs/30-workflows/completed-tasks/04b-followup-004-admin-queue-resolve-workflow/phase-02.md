# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 04b-followup-004-admin-queue-resolve-workflow |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-05-01 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | completed |

## 目的

`GET /admin/requests` 一覧 API、`POST /admin/requests/:noteId/resolve` 確定 API、D1 transaction を伴う repository contract、apps/web `/admin/requests` 画面、admin proxy、visual evidence の設計境界を固定する。

## 実行タスク

1. 一覧 API と確定 API の query / request body / response / error schema を分けて定義する
2. D1 実 schema（`admin_member_notes` / `member_status`）と repository contract を照合し、transaction 境界を明示する
3. apps/web の admin route と proxy 経由の data flow を設計する
4. resolve 操作の二重送信防止（楽観ロック / `request_status='pending'` 限定 UPDATE）を設計する
5. validation matrix と owner matrix を作る

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| DB | apps/api/migrations/* | `admin_member_notes` / `member_status` columns |
| Repository | apps/api/src/repository/adminNotes.ts | markResolved / markRejected |
| Repository | apps/api/src/repository/status.ts | publish_state / is_deleted 更新 |
| Admin route | apps/api/src/routes/admin/* | `requireAdmin` パターン |
| Web admin | apps/web/app/(admin)/layout.tsx | UI gate |
| Proxy | apps/web/app/api/admin/[...path]/route.ts | API gateway |
| Client | apps/web/src/lib/admin/api.ts | admin client 追加先 |

## 実行手順

### ステップ 1: API contract

`GET /admin/requests` query:

| field | type | 制約 |
| --- | --- | --- |
| status | enum | `pending` / `resolved` / `rejected`、既定 `pending` |
| type | enum | `visibility_request` / `delete_request`、必須 |
| limit | number | 1-100、既定 50 |
| cursor | string | 任意。`created_at + note_id` 由来 base64url JSON |

`GET /admin/requests` response:

```ts
type AdminRequestListResponse = {
  items: AdminRequestListItem[];
  nextCursor: string | null;
  appliedFilters: { status: string; type: string };
};

type AdminRequestListItem = {
  noteId: string;
  memberId: string;
  noteType: 'visibility_request' | 'delete_request';
  requestStatus: 'pending' | 'resolved' | 'rejected';
  requestedAt: string;          // created_at (UTC ISO)
  requestedPayload: unknown;    // admin_member_notes.body から PII を除外した projection
  memberSummary: {              // 表示用最小限。生 PII は含めない
    memberId: string;
    publicHandle: string | null;
    publishState: string;
    isDeleted: boolean;
  };
};
```

`POST /admin/requests/:noteId/resolve` request body:

| field | type | 制約 |
| --- | --- | --- |
| resolution | enum | `approve` / `reject` 必須 |
| resolutionNote | string | 任意、最大 500 文字、PII 禁止 |

`POST /admin/requests/:noteId/resolve` response:

```ts
type AdminRequestResolveResponse = {
  noteId: string;
  requestStatus: 'resolved' | 'rejected';
  resolvedAt: string;
  resolvedByAdminId: string;
  memberAfter: {
    memberId: string;
    publishState: string;
    isDeleted: boolean;
  };
};
```

エラーは `404`（noteId 不存在）/ `409 Conflict`（`request_status != 'pending'`）/ `400`（zod validation 失敗）/ `401|403`（admin gate）。order は `created_at ASC, note_id ASC`（古い依頼から処理）に固定する。

### ステップ 2: DB / repository 対応表

| 仕様語 | DB column | 既存 repository | 追加要否 |
| --- | --- | --- | --- |
| noteId | admin_member_notes.note_id | adminNotes.* | なし |
| noteType | admin_member_notes.note_type | findLatestByMemberAndType | filter 追加 |
| requestStatus | admin_member_notes.request_status | markResolved / markRejected | listPending 追加 |
| resolvedAt | admin_member_notes.resolved_at | markResolved / markRejected | なし |
| resolvedByAdminId | admin_member_notes.resolved_by_admin_id | markResolved / markRejected | なし |
| resolutionNote | admin_member_notes.body resolution envelope | markResolved / markRejected optional note | 新規列は作らない |
| publishState | member_status.publish_state | status.updatePublishState | transaction 統合 |
| isDeleted | member_status.is_deleted | status.markDeleted | transaction 統合 |

`adminNotes.listPending(type, cursor, limit)` と `adminNotes.resolveTransaction(noteId, resolution, adminId, note)` を追加する。後者は D1 の実行環境で rollback を実測できる transaction strategy（`batch` または明示的 transaction 相当の helper）に閉じ、`UPDATE admin_member_notes SET request_status=... WHERE note_id=? AND request_status='pending'` で楽観ロックを実現する。`changes()=0` の場合は 409 として上位へ返す。`resolutionNote` は `admin_member_notes.body` の resolution envelope に追記し、schema migration を増やさない。

### ステップ 3: Web topology

| layer | 責務 | 追加候補 |
| --- | --- | --- |
| apps/api route | query / body validation / `requireAdmin` / response | `apps/api/src/routes/admin/requests.ts` |
| apps/api repository | safe WHERE / transaction / 楽観ロック | `adminNotes.listPending` `adminNotes.resolveTransaction` |
| packages/shared | zod schema / types | `AdminRequestList*` `AdminRequestResolve*` |
| apps/web proxy | Auth.js session 再検証 + Worker forwarding | 既存 proxy を流用 |
| apps/web page | queue 一覧 / 詳細 modal / resolve 操作 | `apps/web/app/(admin)/admin/requests/page.tsx` |

### ステップ 4: 楽観ロック・冪等性

resolve API は `WHERE note_id=? AND request_status='pending'` を必須条件とする。`changes()=0` のとき再 SELECT して `request_status` の現在値を取得し、resolved/rejected であれば 409 で `already_resolved` を返す。クライアント側のリトライは `Idempotency-Key` ヘッダ無しでも安全になる（一度確定したら同じ noteId で再 approve 不可）。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | request schema、transaction、楽観ロックを test cases 化 |
| Phase 5 | API / repository 実装順 |
| Phase 6 | UI component（一覧 / modal / confirm dialog）分割 |
| Phase 11 | screenshot と a11y target |

## 多角的チェック観点（AIが判断）

- transaction は D1 の実環境で rollback 証跡を取れる実装に限定し、ステートメント順序（先に admin_member_notes 楽観ロック → 次に member_status 更新）を固定する
- delete_request 承認は論理削除に閉じる。物理削除は別 retention タスクで扱うため本タスクのスコープ外
- `requestedPayload` の projection は `admin_member_notes.body` から PII（email / phone / address）を除外し、admin が判断に必要な最小限のみ露出する
- resolve 後の `memberAfter` を返すことで UI の cache invalidation と確認表示が容易になる

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | API contract | spec_created | 一覧 / 確定 |
| 2 | DB 対応表 | spec_created | `resolutionNote` は body envelope に固定 |
| 3 | Web topology | spec_created | apps/web D1 直参照禁止 |
| 4 | 楽観ロック設計 | spec_created | Phase 4 negative test に連動 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/main.md | 設計サマリ |
| メタ | artifacts.json | Phase 2 spec_created |

## 完了条件

- [ ] DB / API / UI の対応表がある
- [ ] admin gate が Phase 1/2/3 に重複明記されている
- [ ] D1 transaction 境界と楽観ロック条件が明記されている
- [ ] `resolutionNote` を新規列ではなく body envelope に格納する判断が記録されている

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] main.md 配置済み
- [ ] 仕様作成時は artifacts.json の Phase 2 が `spec_created` のまま維持され、実行完了時にのみ `completed` へ更新する

## 次Phase

次: 3 (設計レビュー)。MAJOR があれば Phase 2 に戻す。
