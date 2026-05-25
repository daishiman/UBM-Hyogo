# Phase 1: 要件定義 — issue-870-apps-api-security-headers
> 実装区分: 実装仕様書 / NON_VISUAL / implementation_mode: new / 状態: implemented_local_evidence_captured
> 前 Phase: なし（起点） / 次 Phase: [phase-2-design.md](./phase-2-design.md)

---

## 1. タスク種別

| 項目 | 値 |
|---|---|
| タスク種別 | NON_VISUAL（バックエンド middleware 新規実装） |
| 実装モード | new（`security-headers.ts` は現存しない） |
| 親ワークフロー | `docs/30-workflows/apps-web-security-headers-hardening/`（完了済） |
| carry-over 元 | `docs/30-workflows/completed-tasks/unassigned-task/awshh-followup-004-apps-api-security-headers.md` |
| issue | #870（CLOSED のまま仕様書化。コード調査で未実装を確認済み） |

---

## 2. 背景と動機

親タスク `apps-web-security-headers-hardening` では `apps/web` 側のセキュリティヘッダを整備したが、
`apps/api`（Cloudflare Workers + Hono）側への適用は follow-up として分離された。
現時点（`f114d1188`）の `apps/api` には以下のヘッダが一切付与されていない:

- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security` (HSTS)
- `Referrer-Policy: no-referrer`
- CORS レスポンスヘッダ（`Access-Control-Allow-Origin` 等）

また CORS 制御が存在しないため、任意オリジンから cross-origin リクエストが通る状態である。

---

## 3. 現コード調査結果（`f114d1188` 確定事実）

### 3-1. ファイル不在確認
- `apps/api/src/middleware/security-headers.ts` — 不在
- `apps/api/src/middleware/__tests__/security-headers.spec.ts` — 不在
- `nosniff` / `HSTS` / `Referrer-Policy` / `Access-Control-Allow-Origin` の grep: **0 件**
- `apps/api/src/index.ts` の `app.use` 呼び出し: **0 件**（グローバル middleware 未設定）

### 3-2. 既存 Cache-Control 設定（上書き禁止対象）

| ファイル | route | 設定値 |
|---|---|---|
| `apps/api/src/routes/public/form-preview.ts` | GET /public/form-preview | `"public, max-age=60"` |
| `apps/api/src/routes/public/stats.ts` | GET /public/stats | `"public, max-age=60"` |
| `apps/api/src/routes/public/members.ts` | GET /public/members | `"no-store"` |

**これらは middleware で上書き禁止。** 既存値が存在しない route のみ `no-store` を補完する。

### 3-3. index.ts 構造（行番号）
```
184: const app = new Hono<{ Bindings: Env }>();
186: app.notFound(notFoundHandler);
187: app.onError(errorHandler);
189-199: ルート定義（healthz, public healthz）
203: app.route("/public", createPublicRouter());
206: app.route("/auth", createSessionResolveRoute());
```
middleware 挿入位置: **184 行目直後・186 行目の前**

### 3-4. 既存命名規則

| 対象 | 規則 | 例 |
|---|---|---|
| ファイル名 | kebab-case `.ts` | `security-headers.ts` |
| Hono middleware 型 | `import type { MiddlewareHandler } from "hono"` | 既存 middleware 全般 |
| env schema パターン | `XxxEnvSchema = z.object({...})` + `validateXxxEnv = (env) => Schema.parse(env)` | `AuthSecretEnvSchema` / `validateAuthSecretEnv` |
| env interface | `export interface Env extends SyncEnv, ResponseSyncEnv` (`apps/api/src/env.ts`) | — |
| パッケージ名 | `@ubm-hyogo/api`（`package.json`）| — |
| hono バージョン | `4.12.18`（Hono middleware 利用） | — |

---

## 4. スコープ（In / Out）

### In-scope
- `apps/api/src/middleware/security-headers.ts` の新規作成
- `apps/api/src/middleware/__tests__/security-headers.spec.ts` の新規作成
- `apps/api/src/index.ts` への `corsFromEnv()` / `securityHeaders()` グローバル適用配線
- `apps/api/src/env.ts` の `Env` interface に `ALLOWED_ORIGINS?: string` 追加
- `apps/api/wrangler.toml` の `[env.staging.vars]` / `[env.production.vars]` への `ALLOWED_ORIGINS` 追加

### Out-of-scope
- `apps/web` 側の変更（親タスクで完了済み）
- D1 schema 変更
- 新規 API endpoint 追加
- 既存 Cache-Control 値の変更

---

## 5. 受入条件（Acceptance Criteria）

| ID | 条件 |
|---|---|
| AC-01 | 全レスポンスに `X-Content-Type-Options: nosniff` が付与される |
| AC-02 | 全レスポンスに `Referrer-Policy: no-referrer` が付与される |
| AC-03 | 全レスポンスに `Strict-Transport-Security: max-age=31536000; includeSubDomains` が付与される |
| AC-04 | `/me/*`, `/auth/*`, `/admin/*`, `/internal/*` で Cache-Control 未設定の場合のみ `Cache-Control: no-store` が付与される |
| AC-05 | 既存 Cache-Control（`"public, max-age=60"` / `"no-store"` 等）は middleware が上書きしない |
| AC-06 | CORS allowlist は `env.ALLOWED_ORIGINS`（カンマ区切り）で制御し、未設定時は全拒否（deny-by-default） |
| AC-07 | `wrangler.toml` の `[env.staging.vars]` / `[env.production.vars]` にそれぞれ `ALLOWED_ORIGINS` が追加される |
| AC-08 | `typecheck` / `lint` green |
| AC-09 | `security-headers.spec.ts` の TC-01〜TC-10 が全 green |
| AC-10 | public contract spec（`index.contract.spec.ts`）の Cache-Control 保持回帰が green |

---

## 6. 変更対象ファイル一覧（CONST_005 要件）

| path | 種別 | 変更内容 |
|---|---|---|
| `apps/api/src/middleware/security-headers.ts` | 新規 | middleware 本体・CORS helper・定数定義 |
| `apps/api/src/middleware/__tests__/security-headers.spec.ts` | 新規 | TC-01〜TC-10 Vitest テスト |
| `apps/api/src/index.ts` | 修正 | 184行目直後に `app.use("*", securityHeaders())` + `app.use("*", corsFromEnv())` 追加、import 1行追加 |
| `apps/api/src/env.ts` | 修正 | `Env` interface に `readonly ALLOWED_ORIGINS?: string;` 追加 |
| `apps/api/wrangler.toml` | 修正 | `[env.staging.vars]` / `[env.production.vars]` に `ALLOWED_ORIGINS` 追加 |

---

## 7. 関数シグネチャ予告（詳細は Phase 2 で確定）

Phase 2 で確定する公開 API は以下の 3 点（CONST_005 参照）:
- `securityHeaders(options?: SecurityHeadersOptions): MiddlewareHandler<{ Bindings: Env }>`
- `parseAllowedOrigins(raw?: string): string[]`
- `corsFromEnv(): MiddlewareHandler<{ Bindings: Env }>`

---

## 8. テスト方針予告（詳細は Phase 4 で確定）

- テストファイル: `*.spec.ts`（`*.test.ts` は禁止、CLAUDE.md 不変条件 #8）
- テストランナー: Vitest（unit config）
- TC-01〜TC-10: 静的ヘッダ付与・Cache-Control 非上書き・CORS allowlist deny-by-default 等
- 回帰: `index.contract.spec.ts`（D1 lane: `vitest.d1.config.ts`）

---

## 9. 実行コマンド予告（詳細は Phase 5 で確定）

```bash
# 型チェック
mise exec -- pnpm --filter @ubm-hyogo/api typecheck

# リント
mise exec -- pnpm --filter @ubm-hyogo/api lint

# unit テスト
mise exec -- pnpm exec vitest run apps/api src/middleware/__tests__/security-headers.spec.ts

# 回帰（D1 lane）
mise exec -- pnpm exec vitest run --config vitest.d1.config.ts apps/api/src/routes/public/index.contract.spec.ts
```

---

## 10. DoD（Definition of Done）予告（詳細は Phase 10 で確定）

- typecheck / lint green
- `security-headers.spec.ts` TC-01〜TC-10 green
- public contract spec の Cache-Control 保持回帰 green
- nosniff / HSTS / Referrer 全 route 付与（test 保証）
- CORS allowlist env 別分離（staging / production で独立した `ALLOWED_ORIGINS` 設定）
- 既存 Cache-Control の上書き 0 件

---

## 11. CLAUDE.md 不変条件との適合確認

| 不変条件 | 適合内容 |
|---|---|
| #5 D1 access は apps/api に閉じる | middleware は D1 に触れない（ヘッダ操作のみ） |
| #8 test は `*.spec.ts` のみ | `security-headers.spec.ts`（`*.test.ts` は作成しない） |
| 既存 endpoint surface のみ | 新 endpoint 追加なし |
| D1 schema 変更禁止 | schema 変更なし |
