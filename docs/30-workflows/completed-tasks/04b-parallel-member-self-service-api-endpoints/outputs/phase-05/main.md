# Phase 5 — 実装ランブック 主成果物

`runbook.md` / `pseudocode.md` を参照。

## 実装ステップ実行ログ

1. migration `0006_admin_member_notes_type.sql` 追加 — admin_member_notes に `note_type TEXT NOT NULL DEFAULT 'general'`。
2. `repository/adminNotes.ts` 拡張 — `AdminMemberNoteType` / `findLatestByMemberAndType` / `hasPendingRequest`。
3. `middleware/session-guard.ts` 新規 — `sessionGuard` (DI 型 `SessionResolver`), `requireRulesConsent`。
4. `middleware/rate-limit-self-request.ts` 新規 — in-memory 5/60s + Retry-After。
5. `routes/me/schemas.ts` 新規 — Me*ResponseZ / Me*BodyZ。
6. `routes/me/services.ts` 新規 — `memberSelfRequestQueue`, `resolveEditResponseUrl`。
7. `routes/me/index.ts` 新規 — `createMeRoute(deps)` で 4 endpoint。
8. `apps/api/src/index.ts` に `app.route("/me", createMeRoute({ resolveSession }))` を mount。
   - MVP の resolver: `Authorization: Bearer session:<email>:<memberId>` を直接 parse（dev only。05a/b で Auth.js cookie に置換）。

## Sanity check 結果

- [x] PATCH /me/profile が router に存在しない
- [x] path に `:memberId` を持つ route が `/me/*` に存在しない
- [x] GET /me/profile の response 型に `notes` プロパティがない
- [x] visibility/delete request handler は admin_member_notes / audit_log の 2 ヶ所しか書き込まない
- [x] response_fields 系の write は一切呼ばれない
