# Phase 5: 実装（TDD GREEN）

[実装区分: 実装仕様書]

| 項目   | 値                                          |
| ------ | ------------------------------------------- |
| Task ID | TASK-FIX-ADMIN-SCR-ERR-STG-FU-001-AUTH-ENV |
| Phase  | 5 / 13（実装）                              |
| 依存   | Phase 2（設計）/ Phase 3（レビュー）/ Phase 4（テスト） |
| 成果物 | outputs/phase-5/phase-5.md                  |
| ゲート | GREEN（Phase 4 の env.spec.ts と既存 auth.spec.ts を全 green にする） |

## 1. 目的

Phase 2 設計に従い、env 参照の単一所有権を `apps/web/src/lib/env.ts` に集約する。`EnvSchema` に google 系 4 key を
optional 追加し、`getAuthEnv()`（safeParse partial + `API_SERVICE` binding 同梱）と `AuthEnv` 型を新設する。
`apps/web/src/lib/auth.ts` から `getCloudflareContext` import・`processEnv()`・`cloudflareEnv()`・ローカル `AuthEnv`
interface を撤去し、`getAuthEnv()` へ委譲する。AC-1（`process.env` 0 件）/ AC-2（`getCloudflareContext` 0 件）/ AC-3
（env 取得は `getAuthEnv()` 経由のみ）/ AC-4（schema 拡張）を満たす。

## 2. 変更対象ファイル一覧と変更種別（必須記載）

| パス                              | 変更種別 | 内容                                                                                              |
| --------------------------------- | -------- | ------------------------------------------------------------------------------------------------- |
| `apps/web/src/lib/env.ts`         | 修正     | ① `EnvSchema` に google 系 4 key（optional）追加 ② `AuthEnvSchema`（private）追加 ③ `AuthEnv` 型 export 追加 ④ `getAuthEnv()` export 追加 |
| `apps/web/src/lib/auth.ts`        | 修正     | ① `getCloudflareContext` import 撤去 ② ローカル `AuthEnv` interface 撤去し `import { getAuthEnv, type AuthEnv } from "./env"` ③ `cloudflareEnv()` / `processEnv()` 撤去 ④ `env()` を `{ ...getAuthEnv(), ...globalEnv() }` へ ⑤ `globalEnv()` / `definedEnv()` / `requestEnv()` は保持 |
| `apps/web/src/lib/__tests__/env.spec.ts`    | 新規作成（Phase 4 で定義） | `getAuthEnv()` E-01..E-09 + `getEnv()`/`getPublicEnv()` 回帰 E-10..E-12（Phase 4 §4 のケースを実装） |

> `apps/web/src/lib/auth.spec.ts` は**無改変**（mock / resetEnv はそのまま有効。Phase 3 §3 で検証済み）。
> `apps/web/src/lib/session.ts` は `getAuth()` の公開シグネチャ不変のため**無改変**。

## 3. 関数シグネチャ（current factsの確定形）

```ts
// env.ts（新規 export）
export interface AuthEnv {
  ENVIRONMENT?: "local" | "staging" | "production";
  AUTH_SECRET?: string;
  AUTH_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  AUTH_GOOGLE_ID?: string;
  AUTH_GOOGLE_SECRET?: string;
  INTERNAL_API_BASE_URL?: string;
  INTERNAL_AUTH_SECRET?: string;
  API_SERVICE?: { fetch: typeof fetch };
}
export function getAuthEnv(rawEnv?: RawEnv): AuthEnv;  // throw しない・pure
```

## 4. `env.ts` の Before / After 詳細（Phase 2 §2 準拠）

### 4.1 EnvSchema 拡張（AC-4）

**Before**（`env.ts` 4-18 行）:

```ts
export const EnvSchema = z.object({
  ENVIRONMENT: z.enum(["local", "staging", "production"]),
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  PUBLIC_API_BASE_URL: z.string().url(),
  INTERNAL_API_BASE_URL: z.string().url(),
  INTERNAL_AUTH_SECRET: z.string().min(1).optional(),
  AUTH_URL: z.string().url(),
  SENTRY_DSN_WEB: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.enum(["local", "staging", "production"]),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_ENVIRONMENT: z.enum(["local", "staging", "production"]).optional(),
  NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).optional(),
  AUTH_SECRET: z.string().min(16).optional(),
});
```

**After**（`AUTH_SECRET` の直後に google 系 4 key を追加）:

```ts
export const EnvSchema = z.object({
  ENVIRONMENT: z.enum(["local", "staging", "production"]),
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  PUBLIC_API_BASE_URL: z.string().url(),
  INTERNAL_API_BASE_URL: z.string().url(),
  INTERNAL_AUTH_SECRET: z.string().min(1).optional(),
  AUTH_URL: z.string().url(),
  SENTRY_DSN_WEB: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.enum(["local", "staging", "production"]),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_ENVIRONMENT: z.enum(["local", "staging", "production"]).optional(),
  NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).optional(),
  AUTH_SECRET: z.string().min(16).optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  AUTH_GOOGLE_ID: z.string().min(1).optional(),
  AUTH_GOOGLE_SECRET: z.string().min(1).optional(),
});
```

> optional 追加のみのため `getEnv()` / `getPublicEnv()` の既存 required 検証は不変（E-10..E-12 回帰で固定）。

### 4.2 AuthEnvSchema / AuthEnv 型 / getAuthEnv() の追加

`getEnv()` の直前（または直後）に以下を追加する。`RawEnv` 型・`readRawEnv()` は既存定義を再利用する。

**After（追加分）**:

```ts
// auth 境界が参照する env キーの partial schema（全 optional・fail-closed 用）
const AuthEnvSchema = EnvSchema.pick({
  ENVIRONMENT: true,
  AUTH_SECRET: true,
  AUTH_URL: true,
  GOOGLE_CLIENT_ID: true,
  GOOGLE_CLIENT_SECRET: true,
  AUTH_GOOGLE_ID: true,
  AUTH_GOOGLE_SECRET: true,
  INTERNAL_API_BASE_URL: true,
  INTERNAL_AUTH_SECRET: true,
}).partial();

// service binding を含む auth env の型（API_SERVICE は schema 外の Fetcher binding）
export interface AuthEnv extends z.infer<typeof AuthEnvSchema> {
  API_SERVICE?: { fetch: typeof fetch };
}

/**
 * 認証境界（auth.ts）専用の env アクセサ。
 * - readRawEnv() の cloudflare→process→PLAYWRIGHT 解決を再利用する。
 * - AuthEnvSchema.safeParse で throw せず、失敗時は {} を返す（invariant #11 fail-closed）。
 * - API_SERVICE binding は schema 外なので rawEnv から別途同梱する。
 */
export function getAuthEnv(rawEnv: RawEnv = readRawEnv()): AuthEnv {
  const parsed = AuthEnvSchema.safeParse(rawEnv);
  const base: z.infer<typeof AuthEnvSchema> = parsed.success ? parsed.data : {};
  const binding = (rawEnv as { API_SERVICE?: { fetch: typeof fetch } }).API_SERVICE;
  return binding ? { ...base, API_SERVICE: binding } : base;
}
```

> `AuthEnvSchema` は `.partial()` のため、`PUBLIC_API_BASE_URL` 等の auth 無関係必須項目欠落でも success
> （pick 対象外）。`ENVIRONMENT` enum 不一致 / `AUTH_SECRET` min(16) 違反のときのみ `success=false` → `{}` 返却で
> fail-closed を担保（E-03 / E-09）。

## 5. `auth.ts` の Before / After 詳細（Phase 2 §3 準拠）

### 5.1 import 部（1-15 行）

**Before**:

```ts
import type { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  decodeAuthSessionJwt,
  encodeAuthSessionJwt,
  SESSION_JWT_TTL_SECONDS,
  type GateReason,
  type SessionResolveResponse,
} from "@ubm-hyogo/shared";
```

**After**（`getCloudflareContext` import を撤去し `getAuthEnv` / `AuthEnv` を env.ts から import）:

```ts
import type { NextRequest } from "next/server";
import {
  decodeAuthSessionJwt,
  encodeAuthSessionJwt,
  SESSION_JWT_TTL_SECONDS,
  type GateReason,
  type SessionResolveResponse,
} from "@ubm-hyogo/shared";
import { getAuthEnv, type AuthEnv } from "./env";
```

### 5.2 ローカル `AuthEnv` interface（24-35 行）→ 撤去

**Before**: `export interface AuthEnv { ... }`（24-35 行）

**After**: 削除（型は `./env` から import）。`auth.ts` 内の `AuthEnv` 参照箇所（`cloudflareEnv` / `globalEnv` /
`definedEnv` / `fetchSessionResolve` / `buildAuthConfig` / `requestEnv` / `buildProviders` の引数・戻り型）は
import した型で透過的に解決される。

### 5.3 `cloudflareEnv()`（37-43 行）→ 撤去

**Before**:

```ts
const cloudflareEnv = (): AuthEnv => {
  try {
    return getCloudflareContext().env as AuthEnv;
  } catch {
    return {};
  }
};
```

**After**: 削除（`getAuthEnv()` が `readRawEnv()` 経由で cloudflare 解決を内包する）。

### 5.4 `processEnv()`（56-69 行）→ 撤去

**Before**:

```ts
const processEnv = (): AuthEnv => {
  if (typeof process === "undefined") return {};
  return definedEnv([
    ["ENVIRONMENT", process.env["ENVIRONMENT"]],
    ["AUTH_SECRET", process.env["AUTH_SECRET"]],
    // ... 9 key
    ["INTERNAL_AUTH_SECRET", process.env["INTERNAL_AUTH_SECRET"]],
  ]);
};
```

**After**: 削除（`getAuthEnv()` が `readRawEnv()` → `readProcessEnv()` 経由で process.env 解決を内包する）。

### 5.5 `env()`（71-75 行）→ getAuthEnv へ委譲

**Before**:

```ts
const env = (): AuthEnv => ({
  ...processEnv(),
  ...globalEnv(),
  ...cloudflareEnv(),
});
```

**After**:

```ts
const env = (): AuthEnv => ({
  ...getAuthEnv(),
  ...globalEnv(),
});
```

> 合成順: `getAuthEnv()`（cloudflare 優先解決を内包）を基底に、`globalEnv()`（`__UBM_AUTH_ENV__`・テスト override）を
> 後勝ちで重ねる。これは旧 `{ ...processEnv(), ...globalEnv(), ...cloudflareEnv() }` のうち process/cloudflare を
> `getAuthEnv()` に統合したもの。`globalEnv()` の優先順位（process より上）は維持される。

### 5.6 保持する関数（変更なし）

| 関数            | 行         | 保持理由                                                              |
| --------------- | ---------- | -------------------------------------------------------------------- |
| `globalEnv()`   | 45-47      | `globalThis.__UBM_AUTH_ENV__`。process.env/cloudflare 非依存（AC 対象外） |
| `definedEnv()`  | 49-54      | `requestEnv()` で使用継続（processEnv 撤去後も requestEnv が依存）    |
| `requestEnv()`  | 77-101     | `x-ubm-*` header 注入。process.env/cloudflare 非依存（AC 対象外）     |
| `googleClientId()` / `googleClientSecret()` | 103-106 | 純粋関数。変更なし |
| `fetchSessionResolve` / `buildAuthConfig` / `buildProviders` / `getAuth` | 126-391 | `env()` の戻り型 `AuthEnv` が一致するため透過。`getAuth()` 内 `{ ...env(), ...requestEnv(request) }` も不変 |

> `definedEnv()` は撤去しない。`processEnv()` 撤去後の唯一の利用者は `requestEnv()`。`requestEnv()` を保持する以上
> `definedEnv()` も保持する。

## 6. 実装手順（番号付き）

1. `apps/web/src/lib/env.ts` を開き、`EnvSchema` の `AUTH_SECRET` 行の直後に google 系 4 key（§4.1 After）を追加する。
2. 同ファイルの `getEnv()` 定義の直前に `AuthEnvSchema`（private）→ `AuthEnv`（export interface）→ `getAuthEnv()`
   （export function）を §4.2 のとおり追加する。`RawEnv` / `readRawEnv` は既存定義を参照する（再定義しない）。
3. `apps/web/src/lib/auth.ts` の import から `import { getCloudflareContext } from "@opennextjs/cloudflare";`（15 行）を
   削除し、末尾に `import { getAuthEnv, type AuthEnv } from "./env";` を追加する（§5.1）。
4. `auth.ts` のローカル `export interface AuthEnv { ... }`（24-35 行）を削除する（§5.2）。
5. `auth.ts` の `cloudflareEnv()`（37-43 行）と `processEnv()`（56-69 行）を削除する（§5.3 / §5.4）。
6. `auth.ts` の `env()`（71-75 行）を `{ ...getAuthEnv(), ...globalEnv() }` に置換する（§5.5）。
7. `globalEnv()` / `definedEnv()` / `requestEnv()` / `googleClient*` / 以降の関数は無改変であることを確認する（§5.6）。
8. `apps/web/src/lib/__tests__/env.spec.ts` を Phase 4 §4 のケース表（E-01..E-12）どおり新規作成する。
9. `mise exec -- pnpm exec vitest run --root=. apps/web/src/lib/__tests__/env.spec.ts apps/web/src/lib/auth.spec.ts` を実行し
   全 green を確認する（GREEN ゲート）。
10. `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` を実行し pass を確認する。
11. AC-1 / AC-2 grep gate（§7）を実行し 0 件を確認する。

## 7. ローカル実行・検証コマンド

```bash
# GREEN 確認（env + auth targeted）
mise exec -- pnpm exec vitest run --root=. apps/web/src/lib/__tests__/env.spec.ts apps/web/src/lib/auth.spec.ts

# 型・lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# AC-1 / AC-2 grep gate（いずれも 0 件 = PASS）
grep -n "process\.env" apps/web/src/lib/auth.ts || echo "AC-1 PASS: no process.env"
grep -n "getCloudflareContext" apps/web/src/lib/auth.ts || echo "AC-2 PASS: no getCloudflareContext"
```

## 8. 副作用・入出力・エラーハンドリング

| 関数            | 入力                       | 出力      | 副作用 | エラー時挙動                                          |
| --------------- | -------------------------- | --------- | ------ | ----------------------------------------------------- |
| `getAuthEnv()`  | `rawEnv?`（既定 readRawEnv）| `AuthEnv` | なし   | safeParse 失敗時 `{}`（+ binding 同梱可）→ **throw しない** |
| `env()`（auth）  | なし                       | `AuthEnv` | なし   | 例外を投げない（getAuthEnv が吸収）                    |
| `getEnv()`（既存）| `rawEnv?`                 | `Env`     | なし   | parse 失敗時 throw（**変更なし**・data 境界用）        |

> invariant #11（fail-closed）: env 不在 → `INTERNAL_API_BASE_URL` / `INTERNAL_AUTH_SECRET` undefined →
> `fetchSessionResolve` が `unregistered` 返却（現状と同一挙動）。

## 9. 完了条件（このPhaseの DoD）

- [ ] `env.ts` の `EnvSchema` に google 系 4 key（optional）を追加した
- [ ] `env.ts` に `AuthEnvSchema`（private）/ `AuthEnv`（export）/ `getAuthEnv()`（export）を追加した
- [ ] `auth.ts` から `getCloudflareContext` import を撤去した（AC-2）
- [ ] `auth.ts` から `processEnv()` / `cloudflareEnv()` / ローカル `AuthEnv` interface を撤去した（AC-1）
- [ ] `auth.ts` の `env()` を `{ ...getAuthEnv(), ...globalEnv() }` に変更した（AC-3）
- [ ] `globalEnv()` / `definedEnv()` / `requestEnv()` を保持した
- [ ] `env.spec.ts` を新規作成し E-01..E-12 が green
- [ ] `auth.spec.ts` 全ケース green（無改変）
- [ ] `pnpm typecheck` / `pnpm lint` pass（AC-5）
- [ ] AC-1 / AC-2 grep gate が 0 件
