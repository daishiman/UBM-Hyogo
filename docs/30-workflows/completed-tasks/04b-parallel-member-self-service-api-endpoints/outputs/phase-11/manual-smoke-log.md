# Phase 11 — Manual Smoke Log

UI なしの API タスクのため、スクリーンショットは不要。視覚 evidence の代替として curl / wrangler dev の確認ログを保存する。

## ローカル確認ログ

2026-04-29 のレビュー改善で、手動 smoke の代替として自動 contract / integration test を再実行した。

```text
pnpm --filter @ubm-hyogo/api test -- apps/api/src/routes/me/index.test.ts
Test Files 40 passed (40)
Tests 231 passed (231)
apps/api/src/routes/me/index.test.ts 14 tests passed
```

## 確認済み観点

- `GET /me` は未ログイン 401、認証済み 200、削除済み 410 を返す。
- `GET /me/profile` は `MemberProfile` と `editResponseUrl` / `fallbackResponderUrl` を返し、`notes` / `adminNotes` を返さない。
- `POST /me/visibility-request` は `visibility_request` を `admin_member_notes.note_type` に保存する。
- `POST /me/delete-request` は `delete_request` を queue 化する。
- 6 回目の self request は 429 + `Retry-After` を返す。
