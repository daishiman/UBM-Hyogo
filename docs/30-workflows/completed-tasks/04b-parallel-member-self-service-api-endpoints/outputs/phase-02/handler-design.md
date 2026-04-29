# Phase 2 — Handler / Middleware 設計

## Middleware 連鎖

```
GET  /me               -> sessionGuard
GET  /me/profile       -> sessionGuard
POST /me/visibility-request  -> sessionGuard -> requireRulesConsent -> rateLimitSelfRequest
POST /me/delete-request      -> sessionGuard -> requireRulesConsent -> rateLimitSelfRequest
```

## sessionGuard 責務

1. `resolveSession(request)` で Cookie/JWT を解決（05a/b 提供 hook を依存注入）。null なら 401 UNAUTHENTICATED。
2. `findIdentityByMemberId` + `getStatus` を batch 取得。
3. `is_deleted=1` → 410 + `authGateState=deleted` で即終了（POST も含む）。
4. `rules_consent != "consented"` → `authGateState="rules_declined"` を context に積むが、200 を返す。
5. `findAdminByEmail(email)` で admin 判定し `isAdmin` を SessionUser に注入。
6. `c.set("user", ...)` / `c.set("ctx", DbCtx)`。

## requireRulesConsent

- `c.get("user").authGateState !== "active"` の場合 403 RULES_NOT_ACCEPTED。POST 系のみ適用。
- GET /me / GET /me/profile では適用しない（仕様 7-edit-delete.md と整合）。

## rateLimitSelfRequest

- session 単位 (memberId key) の in-memory bucket。5 req / 60s。
- 超過時 429 + `Retry-After` ヘッダ。
- 多層防御: 二重申請は更に `adminNotes.hasPendingRequest` で 409 を返す。

## handler 内 zod parse 戦略

`zValidator` 等のミドルウェアは使わず、handler 内で `safeParse` を呼ぶ。理由:
- zValidator が壊れると 400 / 422 の差異が出やすい
- 422 + issues 配列を一意に返したい
- request body がない POST (`/me/delete-request`) で `{}` を許容するため
