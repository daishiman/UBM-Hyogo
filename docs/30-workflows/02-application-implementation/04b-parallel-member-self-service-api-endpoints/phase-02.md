# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-self-service-api-endpoints |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| Wave | 4 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | pending |

## 目的

Phase 1 で固定した 4 endpoint を、Hono ルーター / middleware / repository 結線・zod schema・env / dependency matrix・Mermaid 構造図 で実装可能粒度まで設計する。本人プロフィール本文の編集禁止（不変条件 #4）を「PATCH endpoint 不在」「response 型に書き込み手段を含めない」で保証する。

## 実行タスク

- 4 endpoint の zod request/response schema を定義
- Hono route / middleware / handler の module 配置（apps/api/src/routes/me/*.ts）を確定
- session middleware の責務（session 取得 → memberId 解決 → context 注入）を分離
- repository 呼び出しの結線（02a / 02c / 03b）を表で確定
- env / dependency matrix を作成
- Mermaid で request flow を可視化

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/06-member-auth.md | SessionUser |
| 必須 | doc/00-getting-started-manual/specs/07-edit-delete.md | visibility/delete API |
| 必須 | doc/00-getting-started-manual/specs/13-mvp-auth.md | MVP 認証 |
| 必須 | doc/00-getting-started-manual/specs/02-auth.md | 2 系統認証分離 |
| 参考 | doc/00-getting-started-manual/specs/04-types.md | view model 型 |
| 参考 | doc/00-getting-started-manual/specs/01-api-schema.md | system field |

## 構成図 (Mermaid)

```mermaid
graph LR
  Client[apps/web /profile] --> Router[apps/api Hono router]
  Router --> SessionMW[sessionMiddleware]
  SessionMW --> SelfMW[selfMemberOnlyMiddleware]
  SelfMW --> Handler[/me/* handler]
  Handler --> R2a[02a memberRepo / responseRepo]
  Handler --> R2c[02c adminMemberNotesRepo]
  Handler --> R3b[03b currentResponseResolver]
  R3b --> EditUrl[editResponseUrl resolver]
  Handler --> Audit[02c auditLogRepo]
  Audit --> D1[(D1 audit_log)]
  R2a --> D1
  R2c --> D1
  R3b --> Forms[Google Forms cached editResponseUrl]
```

## Module 設計

| module | path | 責務 |
| --- | --- | --- |
| router root | apps/api/src/routes/me/index.ts | `/me` 配下を Hono にマウント |
| GET /me handler | apps/api/src/routes/me/get-session.ts | SessionUser を組成 |
| GET /me/profile handler | apps/api/src/routes/me/get-profile.ts | MemberProfile + editResponseUrl を組成 |
| POST /me/visibility-request handler | apps/api/src/routes/me/post-visibility-request.ts | admin_member_notes 投入 |
| POST /me/delete-request handler | apps/api/src/routes/me/post-delete-request.ts | admin_member_notes 投入 |
| middleware | apps/api/src/middleware/session.ts | Auth.js cookie / JWT 検証 → context.set('user', ...) |
| middleware | apps/api/src/middleware/self-member-only.ts | path に memberId が現れないことを保証 + context.user.memberId のみ使う guard |
| middleware | apps/api/src/middleware/rate-limit-self-request.ts | session 単位 5 req/min |
| schema | apps/api/src/schemas/me.ts | zod schema 4 種 |
| service | apps/api/src/services/edit-response-url.ts | editResponseUrl 解決 + fallback |
| service | apps/api/src/services/self-request-queue.ts | 二重申請判定 + admin_member_notes 投入 |

## Endpoint 仕様（request / response）

### GET /me

- 認可: session 必須
- request: なし
- response 200:
  ```ts
  type GetMeResponse = {
    user: {
      email: string;
      memberId: string;
      responseId: string;
      isAdmin: boolean;
    };
    authGateState: 'active' | 'rules_declined' | 'deleted';
  };
  ```
- response 401: `{ code: 'UNAUTHENTICATED' }`
- 触れる D1: members, member_identities, member_status, admin_users（read only for `isAdmin`）

### GET /me/profile

- 認可: session 必須 + 自身のみ（path に memberId なし）
- request: なし
- response 200:
  ```ts
  type GetMeProfileResponse = {
    profile: MemberProfile;          // public + member field 全部
    statusSummary: {
      publicConsent: 'consented' | 'declined';
      rulesConsent: 'consented' | 'declined';
      publishState: 'public' | 'hidden';
      isDeleted: false;              // true なら 401 / authGateState=deleted で前段で弾く
    };
    editResponseUrl: string | null;
    fallbackResponderUrl: string;    // editResponseUrl=null 時の誘導
  };
  ```
- response 401 / 410（deleted）
- 触れる D1: members, member_responses, response_sections, response_fields, member_field_visibility, member_status

### POST /me/visibility-request

- 認可: session 必須 + 自身のみ
- request:
  ```ts
  type PostVisibilityRequestBody = {
    desiredState: 'hidden' | 'public';
    reason?: string;  // max 500 chars
  };
  ```
- response 202:
  ```ts
  { queueId: string; type: 'visibility_request'; status: 'pending'; createdAt: string };
  ```
- response 409: `{ code: 'DUPLICATE_PENDING_REQUEST' }`
- response 422: `{ code: 'INVALID_REQUEST' }`
- 触れる D1: admin_member_notes (insert), audit_log (insert)

### POST /me/delete-request

- 認可: session 必須 + 自身のみ
- request:
  ```ts
  type PostDeleteRequestBody = { reason?: string };
  ```
- response 202:
  ```ts
  { queueId: string; type: 'delete_request'; status: 'pending'; createdAt: string };
  ```
- response 409 / 422
- 触れる D1: admin_member_notes, audit_log

## Dependency matrix

| 上流 | 提供物 | 本タスク利用箇所 |
| --- | --- | --- |
| 02a memberRepository | findMemberByEmail / findMemberStatus / loadMemberProfile | session middleware / GET /me / GET /me/profile |
| 02a responseFieldsRepository | listFieldsForCurrentResponse(memberId) | GET /me/profile |
| 02a memberFieldVisibilityRepository | resolveVisibility(memberId, stableKey) | GET /me/profile |
| 02c adminMemberNotesRepository | append({type, memberId, body}) / hasPending(type, memberId) | POST visibility / delete |
| 02c auditLogRepository | record(action, target) | POST visibility / delete |
| 03b currentResponseResolver | getCurrentResponse(memberId) → { responseId, editResponseUrl, submittedAt } | GET /me / GET /me/profile |
| 01b view models | MemberProfile / SessionUser / FieldVisibility | 全 endpoint |

## env

| 区分 | 代表値 | 置き場所 | 担当 task | 本タスクの利用 |
| --- | --- | --- | --- | --- |
| Auth.js | AUTH_SECRET | Cloudflare Secrets | 05a | session 検証 (consumer) |
| D1 binding | DB | wrangler binding | 01a | repository 経由 |
| 非機密 | RESPONDER_URL | wrangler vars | 01b | fallback URL 注入 |

本タスクで新規 secret は導入しない。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 3 | 本 Phase の設計を alternative と比較 |
| Phase 4 | endpoint × middleware × repository を verify suite に展開 |
| Phase 5 | 本 module 配置を runbook 化 |
| Phase 7 | endpoint × AC を matrix 化 |

## 多角的チェック観点（不変条件マッピング）

- #4 本文 D1 編集禁止: PATCH 系 endpoint module を一切配置しない（理由: spec 07 の正式経路）
- #5 apps/web → D1 直接禁止: 全 D1 アクセスを apps/api 内 repository に閉じ、apps/web は HTTP のみ（理由: 境界遵守）
- #7 responseId と memberId 混同禁止: GetMeResponse と SessionUser を別フィールド命名（理由: 型安全）
- #11 他人 memberId 露出禁止: `/me/*` の path に `:memberId` を含めない（理由: path 改ざん攻撃面の根絶）
- #12 admin_member_notes 公開非露出: GET 系 response 型に notes プロパティが現れないことを zod で保証（理由: 公開境界）
- #9 /no-access 非依存: GET /me に authGateState を入れて UI 出し分け（理由: 06b の 5 状態出し分け基盤）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | zod schema 4 種定義 | 2 | pending | outputs/phase-02/endpoint-spec.md |
| 2 | module 配置確定 | 2 | pending | outputs/phase-02/handler-design.md |
| 3 | dependency matrix | 2 | pending | 上流 3 タスクとの整合 |
| 4 | Mermaid request flow | 2 | pending | main.md に埋め込み |
| 5 | env / secret matrix | 2 | pending | 新規 secret なしを記録 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/main.md | Phase 2 主成果物 |
| ドキュメント | outputs/phase-02/endpoint-spec.md | zod schema 詳細 |
| ドキュメント | outputs/phase-02/handler-design.md | module 配置と middleware 順序 |
| メタ | artifacts.json | Phase 2 を completed に更新 |

## 完了条件

- [ ] 4 endpoint の zod schema が確定
- [ ] module 配置が apps/api の path レベルで確定
- [ ] dependency matrix で上流 3 タスクの提供物が明示
- [ ] Mermaid と env が main.md に存在
- [ ] PATCH 系 endpoint が一切設計に登場しないこと

## タスク100%実行確認【必須】

- 全実行タスク completed
- 全成果物配置済み
- 全完了条件チェック
- 異常系（401/403/409/422/5xx）の枠を Phase 6 へ引き継ぐ準備
- artifacts.json の Phase 2 を completed に更新

## 次 Phase

- 次: 3 (設計レビュー)
- 引き継ぎ事項: 設計に対する alternative 3 案と PASS-MINOR-MAJOR 判定の入力
- ブロック条件: zod schema or module 配置のいずれかが未確定なら次 Phase に進まない
