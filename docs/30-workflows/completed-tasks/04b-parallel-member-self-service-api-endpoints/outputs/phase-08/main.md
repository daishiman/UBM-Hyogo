# Phase 8 — DRY 化 主成果物

## Before / After (本実装で確定した命名)

### 命名

| 草案 | 採用 | 理由 |
| --- | --- | --- |
| verifyAuthJsSession | `SessionResolver` (DI hook 名) / `sessionGuard` (middleware 名) | 05a/b との結線を依存注入に明示し、helper 名を本タスクで固定しない |
| loadMemberProfileForSelf | `buildMemberProfile` (既存 02a builder) を直接利用 | 重複実装を作らず 02a を消費 |
| selfRequestQueue | `memberSelfRequestQueue` | 02c adminNotes と階層整合 |
| audit action `self.visibility_request` | `member.self.visibility_request` | actor scope を prefix で表現 |

### 型 / module

| 草案 | 採用 |
| --- | --- |
| GetMeResponse | `MeSessionResponse` |
| GetMeProfileResponse | `MeProfileResponse` |
| PostVisibilityRequestBody | `MeVisibilityRequestBody` |
| PostDeleteRequestBody | `MeDeleteRequestBody` |
| `apps/api/src/middleware/self-member-only.ts` | path に :memberId を取らない構造により省略 (middleware 不要) |
| `apps/api/src/services/edit-response-url.ts` | `apps/api/src/routes/me/services.ts::resolveEditResponseUrl` に集約 |
| `apps/api/src/services/self-request-queue.ts` | `apps/api/src/routes/me/services.ts::memberSelfRequestQueue` に集約 |

## 共通化候補 (Wave 4 内)

| 対象 | 04a | 04b | 04c | 共通化案 |
| --- | --- | --- | --- | --- |
| Auth.js session 検証 | 不要 | `SessionResolver` 型を export | 同 | 05a が export, 04b/04c が consume |
| zod 422 整形 | 必要 | handler 内 safeParse + `{ code: 'INVALID_REQUEST', issues }` | 同 | 将来 `apps/api/src/lib/zod-422.ts` へ集約候補 |
| エラーハンドラ | 既存 `error-handler.ts` を全 endpoint で共通利用 | 同 | 同 | 既に共通化済み |
| audit_log helper | 02c が提供、本タスクで consume | - | - | OK |

## 守るべき境界

- middleware 共通化が AC-1 (401 + memberId 不開示) を壊さないこと → sessionGuard は 401 body に memberId を含めない (test で確認済)。
- `MeSessionResponse` と admin 系 SessionUser を 1 型にしない → 別 schema に保持。
- helper 共通化が apps/web に漏れない → `apps/api/src/routes/me/*` に閉じる。
