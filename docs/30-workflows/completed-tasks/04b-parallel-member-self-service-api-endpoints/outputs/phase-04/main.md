# Phase 4 — テスト戦略 主成果物

## 実装した verify suite

`apps/api/src/routes/me/index.test.ts` に contract / authz / integration を統合実装した（14 テスト）。

| 層 | 実体 | カバレッジ |
| --- | --- | --- |
| contract | `MeSessionResponseZ` / `MeProfileResponseZ` / `MeQueueAcceptedResponseZ` で response を parse | GET /me, GET /me/profile, POST x2 |
| authz | 未ログイン 401 / rules_declined 200 + 403 / deleted 410 / 二重申請 409 / 422 | 6 件 |
| integration | seedMember + Hono `app.request` + admin_member_notes 直接 SELECT | 4 件 |
| repository | 既存 `apps/api/src/repository/__tests__/adminNotes.test.ts` が note_type 列追加でも互換動作することを確認 | 7 件すべて pass |

## AC × verify mapping

| AC | テスト | 場所 |
| --- | --- | --- |
| AC-1 | 「未ログインは 401 で memberId を含まない」 | index.test.ts L66 |
| AC-2 | path に :memberId 不在 → 構造保証 (router 定義で path 引数なし) | createMeRoute |
| AC-3 | editResponseUrl + fallback | index.test.ts (F-5 + AC-3) |
| AC-4 | admin_member_notes に visibility_request / delete_request 行 | index.test.ts AC-4 / response_fields 不変 |
| AC-5 | `MeSessionUserZ.memberId` と `responseId` 別フィールド | schemas.ts strict |
| AC-6 | rate limit 5 + 1 で 429 | index.test.ts F-6 |
| AC-7 | authGateState active / rules_declined / deleted | index.test.ts AC-7 / F-3 |
| AC-8 | notes leak 0 (`expect(JSON.stringify).not.toMatch(/notes/)`) | index.test.ts AC-3/AC-8 |
