# Phase 5 — API / repository 実装記録

## 追加・変更ファイル

| ファイル | 種別 | 概要 |
|----------|------|------|
| `apps/api/src/repository/adminNotes.ts` | edit | `listPendingRequests` / `ListPendingRequestsCursor` / `ListPendingRequestsInput` を追加。FIFO + cursor pagination |
| `apps/api/src/routes/admin/requests.ts` | new | `createAdminRequestsRoute()`。GET 一覧 / POST resolve（D1 batch + 楽観ロック）|
| `apps/api/src/index.ts` | edit | `app.route("/admin", adminRequestsRoute)` を mount |
| `apps/api/src/repository/__tests__/adminNotes.test.ts` | edit | RP-1/RP-2 を追記 |
| `apps/api/src/routes/admin/requests.test.ts` | new | TC-01〜TC-10 + 422 ケース |

## key 実装ポイント
- D1 batch サブクエリガード: `WHERE member_id = (SELECT member_id FROM admin_member_notes WHERE note_id=? AND request_status='pending')` で member_status と note の整合性を 1 トランザクションで保証
- 楽観ロック: 最終 UPDATE の `meta.changes === 0` で 409 判定
- PII projection: `PII_KEYS` set で email/phone/name/etc を除去
- audit: `targetType: "member"`（`AuditTargetType` に `admin_member_note` がないため丸める。`payload.noteId` で原典追跡可）
- cursor: `base64url(JSON{createdAt, noteId})`、`(created_at, note_id)` 比較で安定 FIFO

## テスト結果
- repository: 20 tests PASS（既存 18 + 新規 2）
- API route: 10 tests PASS（401 / 一覧 / approve×2 / reject / 二重 / 422 / 404 / バリデーション）
- typecheck: PASS
- lint: PASS

## 不変条件確認
- ✅ #4 / #5: D1 アクセスは API のみ、admin-managed data 分離維持
- ✅ #11: profile 本文 mutation を作っていない
- ✅ #13: tag 直接更新 mutation を作っていない
