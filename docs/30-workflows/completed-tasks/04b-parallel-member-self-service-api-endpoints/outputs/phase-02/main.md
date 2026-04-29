# Phase 2 — 設計 主成果物

## Mermaid: request flow

```mermaid
graph LR
  Client[apps/web /profile] --> Router[apps/api Hono /me]
  Router --> SessionGuard[sessionGuard]
  SessionGuard --> RulesGuard[requireRulesConsent (POST のみ)]
  RulesGuard --> RateLimit[rateLimitSelfRequest (POST のみ)]
  RateLimit --> Handler[me handler]
  SessionGuard --> Handler
  Handler --> Builder[buildMemberProfile (02a)]
  Handler --> Queue[memberSelfRequestQueue (02c notes + audit)]
  Handler --> EditUrl[resolveEditResponseUrl (03b 同期済)]
  Builder --> D1[(D1)]
  Queue --> D1
```

## Module 配置

| module | path |
| --- | --- |
| router | `apps/api/src/routes/me/index.ts` |
| zod schema | `apps/api/src/routes/me/schemas.ts` |
| domain service | `apps/api/src/routes/me/services.ts` |
| session middleware | `apps/api/src/middleware/session-guard.ts` |
| rate limit middleware | `apps/api/src/middleware/rate-limit-self-request.ts` |
| repository 拡張 | `apps/api/src/repository/adminNotes.ts`(`hasPendingRequest`, `findLatestByMemberAndType`, `noteType`) |
| migration | `apps/api/migrations/0006_admin_member_notes_type.sql` |

## env / dependency matrix

| 区分 | 名称 | 配置先 | 担当 task | 利用箇所 |
| --- | --- | --- | --- | --- |
| binding | `DB` | wrangler binding | 01a | 全 endpoint |
| 非機密 | `RESPONDER_URL` / `GOOGLE_FORM_RESPONDER_URL` | wrangler vars | 01b | GET /me/profile fallbackResponderUrl |
| consumer | Auth.js session resolver | 05a/b 提供 | 05a/b | sessionGuard |

本タスクで新規 secret 導入なし。

## PATCH 系 endpoint 不在

router (`createMeRoute`) は GET 2 + POST 2 のみで、PATCH / DELETE method を一切登録しない。これにより不変条件 #4 を構造的に保証する。

## 完了条件

- [x] 4 endpoint の zod schema が確定 (`schemas.ts`)
- [x] module 配置が apps/api の path レベルで確定
- [x] dependency matrix で上流 3 タスクの提供物が明示
- [x] Mermaid と env が main.md に存在
- [x] PATCH 系 endpoint が一切設計に登場しない
