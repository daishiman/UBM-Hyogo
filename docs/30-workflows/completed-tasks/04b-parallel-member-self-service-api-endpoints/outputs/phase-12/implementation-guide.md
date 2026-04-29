# Phase 12 — Implementation Guide

## 追加/変更ファイル

| ファイル | 役割 |
| --- | --- |
| `apps/api/migrations/0006_admin_member_notes_type.sql` | `admin_member_notes.note_type` 列追加 |
| `apps/api/src/repository/adminNotes.ts` | `noteType` フィールド + `findLatestByMemberAndType` + `hasPendingRequest` |
| `apps/api/src/middleware/session-guard.ts` | `sessionGuard(deps)` + `requireRulesConsent` |
| `apps/api/src/middleware/rate-limit-self-request.ts` | session 単位 5/60s rate limit |
| `apps/api/src/routes/me/schemas.ts` | zod schema 4 種 |
| `apps/api/src/routes/me/services.ts` | `memberSelfRequestQueue`, `resolveEditResponseUrl` |
| `apps/api/src/routes/me/index.ts` | `createMeRoute(deps)` 4 endpoint |
| `apps/api/src/routes/me/index.test.ts` | contract / authz / integration 14 ケース |
| `apps/api/src/index.ts` | `app.route("/me", createMeRoute({ resolveSession }))` |

## 暫定 dev session

05a/05b の Auth.js resolver が入るまで、ローカル確認では `x-ubm-dev-session: 1` と
`Authorization: Bearer session:<email>:<memberId>` を同時に送る。`x-ubm-dev-session: 1`
が無い request は dev token を無効化し、401 として扱う。`ENVIRONMENT=production` /
`ENVIRONMENT=staging` では、このヘッダがあっても dev token を受け付けない。

## DI 結線 (05a/b 連携時)

```ts
import { createMeRoute } from "./routes/me";
import { authJsSessionResolver } from "./auth/session-resolver"; // 05a/b 提供予定

app.route(
  "/me",
  createMeRoute({ resolveSession: authJsSessionResolver }),
);
```

## migration 適用手順

```bash
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production
```

既存行の `note_type` は DEFAULT 'general'。本タスクが追加する 'visibility_request' / 'delete_request' は新規行のみで使用。

## ロールバック

`note_type` 列を消す migration を逆方向で書くか、note_type='general' 以外の行を archive 後に削除する。本タスクは additive なので rollback リスクは低い。
