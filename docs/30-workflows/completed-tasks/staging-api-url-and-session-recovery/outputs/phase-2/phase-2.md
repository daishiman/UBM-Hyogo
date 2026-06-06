# Phase 2: 設計

## topology（SubAgent lane / validation path）

3 並列 lane（独立・責務交差なし）→ validation lane を直列で締める。

```
Lane A (server fetch service-binding)  ─┐
Lane B (client localhost eradication)  ─┼─► validation: typecheck → lint → vitest(対象) → verify-pr-ready.sh
Lane C (cf secret + gate + smoke)      ─┘                                    （staging smoke は user-gated）
```

CONST_007: 3 lane すべて 1 実装サイクル / 1 PR。

## 既存コンポーネント再利用可否（FB-SDK-07-1）

- **再利用**: `public.ts` の service-binding 選択ロジック（`getServiceBinding()` / `isTestOrPlaywright()`）を `authed.ts` / proxy に **移植・共通化**する。新規 transport 概念は作らない。
- **再利用**: env アクセサ（`getAuthEnv()` は既に `API_SERVICE` を返す。env.ts:139-141）。`getApiBaseEnv()` を binding 対応へ拡張するか、`authed.ts` を `getAuthEnv()` 参照へ切替。
- **新規最小**: `scripts/` 3 本（diagnose / secret-put / smoke）+ grep gate 1 本。

## Lane A 設計: server-side fetch の service-binding 統一

### A-1. 共通 transport helper の抽出

`apps/web/src/lib/fetch/` に **transport 選択の単一実装**を置く（重複排除）。

```ts
// apps/web/src/lib/fetch/transport.ts（新規）
export interface ApiTransportEnv {
  API_SERVICE?: { fetch: typeof fetch };
  baseUrl?: string;        // INTERNAL_API_BASE_URL or PUBLIC_API_BASE_URL（解決済み）
  environment?: "local" | "staging" | "production";
  isTest?: boolean;        // NODE_ENV==="test" || PLAYWRIGHT_TEST==="1"
}

/** binding 優先・test で baseUrl 明示時のみ HTTP・local fallback は localhost。 */
export function resolveApiFetch(env: ApiTransportEnv): {
  kind: "service-binding"; fetch: typeof fetch;
} | { kind: "http"; baseUrl: string };
```

判定規則（AC-1/2/3）:

| 条件 | transport |
|------|-----------|
| `isTest && baseUrl` あり | http（mock API 差替）|
| `API_SERVICE` あり | service-binding（staging/production の正規経路）|
| `baseUrl` あり（binding なし・非 test） | http（local `next dev` 等）|
| いずれも無 & `environment==="local"` | http `http://localhost:8787`（local fallback のみ）|
| いずれも無 & 非 local | **throw**（fail-closed・staging/production で localhost に落とさない）|

### A-2. `fetchAuthed` の binding 化

```ts
// apps/web/src/lib/fetch/authed.ts（編集）
import { getAuthEnv } from "@/lib/env";          // API_SERVICE + INTERNAL_API_BASE_URL を返す
import { resolveApiFetch } from "./transport";

export const fetchAuthed = async <T>(path: string, init?: RequestInit): Promise<T> => {
  if (!path.startsWith("/")) throw new Error(`fetchAuthed: path must start with '/': ${path}`);
  const env = getAuthEnv();                        // env.ts:136-142
  const t = resolveApiFetch({
    API_SERVICE: env.API_SERVICE,
    baseUrl: env.INTERNAL_API_BASE_URL ?? undefined,
    environment: getEnvironment(),                 // env.ts に getEnvironment() を足す
    isTest: isTestRuntime(),
  });
  const cookieHeader = await buildCookieHeader();
  const headers = new Headers(init?.headers);
  if (cookieHeader.length > 0) headers.set("cookie", cookieHeader);
  if (!headers.has("accept")) headers.set("accept", "application/json");
  const res = t.kind === "service-binding"
    ? await t.fetch(`https://service-binding.local${path}`, { ...init, headers, cache: "no-store" })
    : await fetch(`${t.baseUrl}${path}`, { ...init, headers, cache: "no-store" });
  if (res.status === 401) throw new AuthRequiredError();
  if (!res.ok) throw new FetchAuthedError(res.status, await res.text().catch(() => ""));
  return (await res.json()) as T;
};
```

> service binding の `fetch(url)` は host を無視するが URL parse のため任意 host（`service-binding.local`）を使う（public.ts:69 と同パターン）。cookie は header で明示転送するため、cross-origin cookie policy の影響を受けない。

### A-3. proxy / auth route の binding 化

| ファイル | 現状 | 変更 |
|---------|------|------|
| `app/api/me/[...path]/route.ts` | plain `fetch(target)` + `FALLBACK="http://127.0.0.1:8787"` | `resolveApiFetch` 経由。binding 優先・local fallback 限定 |
| `app/api/admin/[...path]/route.ts` | `LOCAL_DEV_FALLBACK` | 同上（admin は `getAdminFetchEnv()` が `API_SERVICE` を返す。env.ts:174-191） |
| `app/api/auth/magic-link/route.ts` / `verify/route.ts` / `gate-state/route.ts` | `FALLBACK_INTERNAL_API` | 同上 |
| `src/lib/auth/verify-magic-link.ts` | `FALLBACK_INTERNAL_API` | 同上 |

> 各 route の cookie/authorization/content-type forward ロジックは現状維持（route.ts:45-53）。**transport 選択だけ**を差し替える。

### A-4. env.ts の補助アクセサ

```ts
// apps/web/src/lib/env.ts（追記）
export function getEnvironment(rawEnv = readRawEnv()): "local" | "staging" | "production" {
  const v = rawEnv["ENVIRONMENT"];
  return v === "staging" || v === "production" ? v : "local";
}
// getAuthEnv は既に API_SERVICE を返す。getAdminFetchEnv / getPublicFetchEnv も binding を expose 済み。
```

## Lane B 設計: client bundle の localhost 焼き込み根絶

### B-1. client 参照を `NEXT_PUBLIC_API_BASE_URL` へ統一

`public.ts` は **server から呼ばれる時は binding**、client/local HTTP fallback 時のみ base URL が要る。client bundle に inline されるのは `NEXT_PUBLIC_*` のみ。

```ts
// apps/web/src/lib/fetch/public.ts（編集）
function getBaseUrl(): string {
  const env = getPublicFetchEnv();
  // NEXT_PUBLIC_API_BASE_URL は build 時 inline され client でも解決可能
  const url = env.NEXT_PUBLIC_API_BASE_URL ?? env.PUBLIC_API_BASE_URL;
  if (url) return url;
  if (getEnvironment() === "local") return "http://localhost:8787"; // local 限定
  throw new Error("public fetch: API base URL unresolved in non-local runtime");
}
```

### B-2. `getPublicFetchEnv` に `NEXT_PUBLIC_API_BASE_URL` を含める

`PublicFetchEnv` interface（env.ts:61-66）に `NEXT_PUBLIC_API_BASE_URL?: string` を追加し、`getPublicFetchEnv`（env.ts:155-172）で `process.env` / `rawEnv` 双方から解決。`NEXT_PUBLIC_*` は build inline なので client でも `process.env` 参照で値が入る。

### B-3. wrangler.toml / web-cd.yml の整理

- `NEXT_PUBLIC_API_BASE_URL` は **build env（web-cd.yml）と runtime vars（wrangler.toml）の両方**に必須（inline + runtime 両対応）。現状両方にあり（wrangler.toml:32, web-cd.yml:33）→ 維持。
- `PUBLIC_API_BASE_URL`（非 inline）は server-only 経路（authed/admin = INTERNAL）では不要化。public 経路を NEXT_PUBLIC へ寄せた後、**段階的に残すが参照を NEXT_PUBLIC 優先**にする（後方互換のため schema からは即削除しない）。

> drift 注意: env.ts schema の key と wrangler.toml vars の key を一致させる。`SENTRY_DSN_WEB` 等の secret 系は意図的に toml 非記載（Secrets）。

## Lane C 設計: CF secret parity + grep gate + smoke

### C-1. `AUTH_SECRET` parity 診断 script

```bash
# scripts/diagnose-auth-secret-parity.sh（新規・read-only）
# web worker と api worker（staging）の AUTH_SECRET secret の "存在" を cf.sh secret list で確認。
# 値そのものは表示・比較しない（L-AUTHSECRET-001: presence != usability）。
# 値一致は runtime smoke（/me 200）で間接証明する。
bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env staging   # AUTH_SECRET 行の有無
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging   # AUTH_SECRET 行の有無
# どちらか欠落 → exit 1 + 「cf-secret-put-auth-secret.sh で投入せよ」を案内。
```

### C-2. `AUTH_SECRET` 投入ラッパ（user-gated）

```bash
# scripts/cf-secret-put-auth-secret.sh（新規）
# 同一値を web/api 両 staging worker へ投入し parity を担保。
# 値は 1Password 参照（op://）or stdin。32+ chars（api env.ts:129 / web env.ts:23 の min 制約）検証。
# 実走は user-gated（CONST_007 例外）。dry-run（--check）で長さ検証のみ可。
```

### C-3. grep gate 強化（task-18）

```bash
# scripts/verify-no-localhost-bake.sh（新規・CI gate）
# 1. apps/web/src 配下の localhost/127.0.0.1:(8787|8888) 無条件焼き込みを検出（許可: env.ts の local fallback と
#    transport.ts の local 分岐のみ allowlist コメント `// localhost-allow:local-fallback` 付き）。
# 2. ビルド済 client bundle（.open-next/assets の *.js）に localhost:8787 / 127.0.0.1 が現れたら fail。
# self-test: fixture で意図的混入を検出できることを確認。
```

`.github/workflows/` に job 追加（`verify-design-tokens` と同様の docs/code gate 並び）。

### C-4. staging runtime smoke（user-gated）

```bash
# scripts/smoke-staging-me.sh（新規）
# 認証 cookie（storage-state / magic-link）を用い、
#   GET https://ubm-hyogo-web-staging.../api/me → 200 + {user.memberId}
#   GET .../profile → data-testid="profile-authenticated-root" を含む（再ログインカード非表示）
# を curl/playwright で検証。実走は user-gated。
```

## ライブラリ選定

新規ライブラリ追加なし（fetch / zod / 既存 cf.sh ラッパのみ）。

## エラーハンドリング設計

- staging/production で base URL も binding も無い場合は **throw（fail-closed）**。silent な localhost fallback を禁止（AC-3）。
- secret 欠落時、API resolver は既に `UBM-AUTH-SECRET-MISSING` を log し null 返却（me-session-resolver.ts:56-63）。診断 script はこの log と smoke の 401 を突合する手順を記載。

## ステップ間 state / 引き渡し（lane 間）

| from → to | 引き渡し |
|-----------|---------|
| A → C | `resolveApiFetch` の env 別分岐が smoke の期待（staging=binding 200）を規定 |
| B → C | grep gate の allowlist 対象（env.ts/transport.ts の local 分岐）を確定 |
