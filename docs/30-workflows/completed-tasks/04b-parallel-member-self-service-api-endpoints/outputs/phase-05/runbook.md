# Phase 5 — Runbook

## Step 1: migration

`apps/api/migrations/0006_admin_member_notes_type.sql` を追加。`note_type` 列 + `idx_admin_notes_member_type` index。

## Step 2: repository 拡張

`apps/api/src/repository/adminNotes.ts` に以下を追加:
- `AdminMemberNoteType` 型
- `noteType` フィールドを `AdminMemberNoteRow` / `NewAdminMemberNote` / SELECT_COLS に追加
- `findLatestByMemberAndType(ctx, memberId, type)`
- `hasPendingRequest(ctx, memberId, type)`

## Step 3: session middleware

`apps/api/src/middleware/session-guard.ts`:
- `SessionResolver` 型 (DI hook for Auth.js)
- `sessionGuard(deps)` — 401 / 410 / context.set
- `requireRulesConsent` — POST 系で 403

## Step 4: rate limit

`apps/api/src/middleware/rate-limit-self-request.ts` — in-memory 5/60s。
KV / D1 化は将来課題（failure-cases.md F-6 参照）。

## Step 5: schemas / services

`apps/api/src/routes/me/schemas.ts`, `services.ts`。

## Step 6: handler & router

`apps/api/src/routes/me/index.ts` の `createMeRoute(deps)`。
- GET `/`、GET `/profile`、POST `/visibility-request`、POST `/delete-request`。
- POST 系のみ `requireRulesConsent` + `rateLimitSelfRequest` を適用。

## Step 7: app mount

`apps/api/src/index.ts` で `app.route("/me", createMeRoute({ resolveSession }))`。
MVP の `resolveSession` は dev-only Bearer parser、05a/b で Auth.js cookie に差し替え。

## Step 8: test

`mise exec -- pnpm --filter @ubm-hyogo/api test` で 231 件 pass を確認。
