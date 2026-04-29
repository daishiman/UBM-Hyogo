# dependency-confirmation.md — 上流タスク signature 確認

## 上流 4 タスクの Phase 13 完了確認

| タスク | 状態（前提） | 提供物 | 受領 signature |
| --- | --- | --- | --- |
| 02a-parallel-member-identity-status-and-response-repository | Phase 13 完了想定 | member_identities / member_status repository | 下記 |
| 02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary | Phase 13 完了想定 | admin_users repository | 下記 |
| 04b-parallel-member-self-service-api-endpoints | Phase 13 完了想定 | `/me/*` endpoints | 下記 |
| 04c-parallel-admin-backoffice-api-endpoints | Phase 13 完了済（commit `e1cf8c7`） | `/admin/*` endpoints | 下記 |

> 04c はすでに main にマージ済（commit `e1cf8c7 feat(api): 04c admin backoffice API endpoints 実装`）。

## 02a 提供物 signature

`apps/api/src/repository/identities.ts` 既存:

```ts
export async function findIdentityByEmail(
  c: DbCtx,
  email: ResponseEmail,
): Promise<MemberIdentityRow | null>;

export async function findIdentityByMemberId(
  c: DbCtx,
  id: MemberId,
): Promise<MemberIdentityRow | null>;
```

**05a での追加要請（02a へのフィードバック候補）**:
- `findIdentityByEmail` の戻り値に `member_status` の `rules_consent` / `is_deleted` を join した拡張版が欲しい
- 候補名: `findIdentityWithStatusByEmail(c, email): Promise<{ identity: MemberIdentityRow; status: MemberStatusRow } | null>`
- 既に存在しなければ 05a の Phase 5 で `apps/api/routes/auth.ts` 内に集約 SQL を実装し、02a へのフィードバックは ADR で残す

## 02c 提供物 signature

`apps/api/src/repository/adminUsers.ts` 既存:

```ts
export const findByEmail = async (
  c: DbCtx, email: AdminEmail,
): Promise<AdminUserRow | null>;

export const findById = async (
  c: DbCtx, adminId: AdminId,
): Promise<AdminUserRow | null>;

export const isActiveAdmin = async (
  c: DbCtx, email: AdminEmail,
): Promise<boolean>;
```

**05a で利用するもの**: `isActiveAdmin(email)`（session-resolve で email→isAdmin を 1 query で）。または `findByEmail(email)` の `active === true` 判定。

> 注意: 05a では「`memberId` から isAdmin を引く」ではなく「`email` から isAdmin を引く」を採用する（`admin_users` schema は email PK）。これにより member_identities lookup と独立して並列実行できる（session-resolve 内では sequential でも 2 query で済む）。

## 04b 提供物（参考）

`/me/*` API set。session 確立後に web から呼ぶ。05a の責務外（gate のみ提供）。

## 04c 提供物（参考）

`/admin/*` API set。`requireAdmin` で保護対象。既存 `admin-gate.ts`（Bearer SYNC_ADMIN_TOKEN）からの差し替えを 05a で実施。

## 既存実装の確認

### `apps/api/src/middleware/admin-gate.ts`（MVP スタブ）

```ts
// 03a: 最小 admin gate スタブ。
// 本格的な admin 認証（Auth.js + admin_users table 照合）は後続 wave で差し替える前提。
// MVP は Bearer SYNC_ADMIN_TOKEN 一致で 200、未設定なら 500、未一致なら 401 / 403 を返す。
export const adminGate: MiddlewareHandler<{ Bindings: AdminGateEnv }> = async (c, next) => { ... };
```

**05a での扱い**:
- `adminGate`（Bearer SYNC_ADMIN_TOKEN）は **sync 系 endpoint 専用**として残し、`requireSyncAdmin` にリネーム
- 人間の admin 操作用に `requireAdmin`（JWT + `admin_users` 照合）を新設
- Phase 5 ランブックで rename + 新規追加の手順を確定

### `apps/api/migrations/0003_auth_support.sql`

`admin_users` / `magic_tokens` / `sync_jobs` / `audit_log` 4 テーブルが既に作成済。**05a では新規 migration 不要**（JWT session strategy のため `sessions` テーブルも追加しない）。

### `apps/web/src/lib/`

現状 `tones.ts` のみ。`auth.ts` / `session.ts` 等は **本タスクで新規作成**。

## ブロッカー / 仮定

| # | 内容 | 解決方法 |
| --- | --- | --- |
| B1 | 02a の `member_status` join helper が未提供の可能性 | 05a 内で SQL を直接書く（Phase 2 で確定） |
| B2 | `packages/shared` の brand 型 `MemberId` 等が共有可能か | 既に `apps/api/src/repository/_shared/brand.ts` に存在。05a で `packages/shared` に migration 必要なら Phase 5 ランブックで実施 |
| B3 | 04b/04c の Phase 13 完了状態（02a/02c も） | 04c は完了済を確認。02a/02c/04b は本タスク開始時点では Phase 13 完了想定で進める。差分があれば Phase 5 で adapter 層を追加 |

## 4 条件再評価（依存確認後）

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 上流からの input は揃っている |
| 実現性 | PASS | 既存 repository signature を活用、追加実装は SQL の join のみ |
| 整合性 | PASS | 既存 admin-gate.ts は sync 用に隔離、JWT-based requireAdmin は独立追加 |
| 運用性 | PASS | migration 追加なし、D1 row 増なし |
