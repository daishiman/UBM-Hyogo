# Phase 8 — DRY 化: 命名 / 型 / path / endpoint の統一

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 05a-parallel-authjs-google-oauth-provider-and-admin-gate |
| Phase | 8 / 13 |
| Wave | 5 |
| 種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | phase-07（AC マトリクス） |
| 下流 | phase-09（品質保証） |

## 目的

命名 / 型 / path / endpoint を整理し、apps/web ・ apps/api ・ packages/shared に重複や名称ゆれが残らない状態にする。Before / After 表で変更を可視化し、05b と命名を共有する。

## 実行タスク

1. 型 / interface 重複の整理（SessionUser / SessionJwt / SessionResolveResult）
2. endpoint path / method 命名統一
3. environment variable 名称統一（05b と整合）
4. file path / module 名整理
5. middleware naming 統一

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/architecture.md | module 構成 |
| 必須 | outputs/phase-02/api-contract.md | I/O |
| 参考 | doc/00-getting-started-manual/specs/04-types.md | 型 4 層 |
| 参考 | doc/02-application-implementation/05b-parallel-magic-link-provider-and-auth-gate-state/outputs/phase-08/main.md | 共有命名 |

## 実行手順

### ステップ 1: Before / After（型）

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| session 型 | `MeSession` / `Session` 等の揺れ候補 | `SessionUser` (04-types.md, 05b と共有) | 4 層型統一 |
| JWT claim | `JwtToken` / `AuthClaims` | `SessionJwt` | 用途明示 |
| resolve result | `MemberLookup` / `IdentityResult` | `SessionResolveResult` | endpoint と対応 |
| gate 拒否理由 | `gateError` / `denyReason` | `gateReason` (`"unregistered"|"deleted"|"rules_declined"`) | 05b と共有 |
| admin 判定 | `is_admin` (snake) / `admin: boolean` | `isAdmin: boolean` (camel) | TS 規約 |
| memberId | `MemberId` (string) と `userId` の混在 | `MemberId` 1 本 | 不変条件 #7 |

### ステップ 2: Before / After（endpoint）

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| session 解決 | `GET /me-by-email` / `GET /auth/lookup` | `GET /auth/session-resolve` | 動作と一致 |
| admin gate API | `requireAdminUser` / `adminOnly` | `requireAdmin` (Hono middleware) | 短く統一 |
| auth handlers | `/api/nextauth/*` | `/api/auth/[...nextauth]` (Auth.js v5 標準) | 公式パス |
| signin path | `/signin/google` | `/api/auth/signin/google` (Auth.js 標準) | 公式 |
| callback path | `/oauth/callback` | `/api/auth/callback/google` (Auth.js 標準) | 公式 |

### ステップ 3: Before / After（env）

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| auth secret | `NEXTAUTH_SECRET` | `AUTH_SECRET` (Auth.js v5) | 公式更新 |
| auth url | `NEXTAUTH_URL` | `AUTH_URL` | 公式更新 |
| Google client | `GOOGLE_OAUTH_CLIENT_ID` | `GOOGLE_CLIENT_ID` | Auth.js 規約 |
| Google secret | `GOOGLE_OAUTH_CLIENT_SECRET` | `GOOGLE_CLIENT_SECRET` | 同上 |
| internal token | `WORKER_TOKEN` / `API_TOKEN` | `INTERNAL_AUTH_SECRET` | 用途明示 |

### ステップ 4: Before / After（file path）

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| Auth.js config | `apps/web/auth.ts` | `apps/web/src/lib/auth.ts` | next-auth v5 慣例 |
| route handler | `apps/web/src/app/auth/[[...slug]]/route.ts` | `apps/web/src/app/api/auth/[...nextauth]/route.ts` | 公式 |
| middleware | `apps/web/src/middleware.ts` | `apps/web/middleware.ts` (root) | next.js 規約 |
| session-resolve | `apps/api/src/routes/me.ts` | `apps/api/src/routes/auth/session-resolve.ts` | layer 分離 |
| requireAdmin | `apps/api/src/auth/admin.ts` | `apps/api/src/middleware/require-admin.ts` | layer 分離 |
| shared 型 | `packages/shared/src/types.ts` | `packages/shared/src/auth.ts` (`SessionUser`, `SessionJwt`, `verifyJwt`) | 役割分離 |

### ステップ 5: middleware naming 統一

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| auth check | `withAuth` / `protectRoute` | `requireAuth` (Hono) | hono 規約 + 動詞 |
| admin check | `adminGuard` / `mustBeAdmin` | `requireAdmin` (Hono) | 同上 |
| edge gate | `adminMiddleware` | `default export auth((req) => ...)` (Auth.js v5) | next-auth 公式 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | 命名統一後の lint / typecheck pass |
| 05b Phase 8 | 共有 env / shared 型の整合 |
| 08a | contract test の path / 型一致確認 |

## 多角的チェック観点

| 観点 | 内容 | 関連不変条件 |
| --- | --- | --- |
| #2 (consent キー統一) | gateReason の文字列が `"rules_declined"` であり `"consent_declined"` 等に変えない | #2 |
| #5 (apps/web → D1 禁止) | apps/web 配下に `repository/` `services/` が混入しない | #5 |
| #7 (memberId と responseId 分離) | `MemberId` 型を 1 本化、`responseId` と区別 | #7 |
| 認可境界 | `SessionResolveResult` に `responses`/`profile` を含めない | #11 |
| 05b 整合 | env / shared 型を共有することで AC-9 を担保 | - |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 型 Before / After | 8 | pending | 6 件 |
| 2 | endpoint Before / After | 8 | pending | 5 件 |
| 3 | env Before / After | 8 | pending | 5 件 |
| 4 | file path Before / After | 8 | pending | 6 件 |
| 5 | middleware naming | 8 | pending | 3 件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | Before / After 表 |
| メタ | artifacts.json | phase 8 status |

## 完了条件

- [ ] 型・endpoint・env・file path・middleware の 5 種で Before / After 表が完成
- [ ] spec 用語との一致を全行で確認
- [ ] 05b との共有命名（env, shared 型）が一致
- [ ] 不変条件 #2, #5, #7 への配慮が明記

## タスク100%実行確認【必須】

- 全 5 サブタスクが completed
- outputs/phase-08/main.md 配置
- 全完了条件にチェック
- 次 Phase へ命名規約を引継ぎ

## 次 Phase

- 次: 9 (品質保証)
- 引き継ぎ事項: 命名統一案を typecheck / lint の入力に
- ブロック条件: spec 用語と不一致な命名が残る場合は進まない
