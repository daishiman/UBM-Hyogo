# T01: fetch 層の fail-closed + describeTransport + 診断メタ付与

> レーン A。**T02（`getEnvironmentResolution`）に依存**するため T02 確定後に着手する。`transport.ts` / `errors.ts` / `authed.ts` の 3 ファイルを扱う。

正本参照: `../../_shared-context.md`（§4 F1/F3/F4・§5 シグネチャ）/ `../phase-4/phase-4.md`（§1 describeTransport・§3 解決順序・§5 error shape・§6 T1/T3）/ `../phase-2/phase-2.md`（§3 配線・§4 describeTransport）

## 変更対象ファイル

| # | ファイル | 種別 | 変更概要 |
|---|---------|------|---------|
| 1 | `apps/web/src/lib/fetch/transport.ts` | 編集 | (a) `ApiTransportEnv` に optional `environmentExplicit?: boolean` 追加。(b) `resolveApiFetch` step4 を fail-closed 化。(c) `ApiTransportDescriptor` 型 + `describeTransport()` を新規 export |
| 2 | `apps/web/src/lib/fetch/errors.ts` / `transport.ts` | 編集 | (a) `FetchAuthedError` に optional `transport?: ApiTransportDescriptor` を追加（constructor 後方互換）。(b) `ApiTransportError` を `transport.ts` で新規 export |
| 3 | `apps/web/src/lib/fetch/authed.ts` | 編集 | `getEnvironmentResolution` で fail-closed を配線。`describeTransport` で診断ラベル生成し、非2xx は `FetchAuthedError`、fetch throw は `ApiTransportError` に `transport` メタを付与 |
| 4 | `apps/web/src/lib/fetch/transport.spec.ts` | 編集 | T1-1〜T1-6 追加 |
| 5 | `apps/web/src/lib/fetch/authed.spec.ts` | 編集 | T3-1〜T3-6 追加 |
| 6 | `apps/web/src/lib/fetch/__tests__/transport-select.spec.ts` | 編集（必要時のみ） | T2 は当ファイル既存挙動の回帰確認に留める（Phase 4 §6 T2 注記）。`resolveApiFetch` 系新規ケースは T1 に集約済のため、当ファイルに追加が不要なら本項は変更なし |

新規ファイルは作らない（既存ファイルに追記）。

## シグネチャ

```ts
// transport.ts
export interface ApiTransportEnv {
  API_SERVICE?: { fetch: typeof fetch } | undefined;
  baseUrl?: string | undefined;
  environment?: "local" | "staging" | "production" | undefined;
  environmentExplicit?: boolean | undefined; // 追加。true のときだけ local fallback 許可
  isTest?: boolean | undefined;
}

export interface ApiTransportDescriptor {
  readonly transportKind: "service-binding" | "http";
  readonly baseHost: string; // service-binding は SERVICE_BINDING_ORIGIN の host、http は new URL(baseUrl).host
}
export function describeTransport(t: ApiTransport): ApiTransportDescriptor;

export function resolveApiFetch(env: ApiTransportEnv): ApiTransport; // step4 条件のみ改修

// errors.ts
export class FetchAuthedError extends Error {
  readonly status: number;
  readonly bodyText: string;
  readonly transport?: ApiTransportDescriptor;
  constructor(
    status: number,
    bodyText: string,
    transport?: ApiTransportDescriptor,
  );
}

// transport.ts
export class ApiTransportError extends Error {
  readonly transport: ApiTransportDescriptor;
  readonly cause?: unknown;
  constructor(message: string, transport: ApiTransportDescriptor, cause?: unknown);
}
```

### `resolveApiFetch` step4 改修（Phase 4 §3.1）

step4 の条件を次に変更する（他 step は不変）:

```
旧: if ((env.environment ?? "local") === "local") { return http(ローカルフォールバック) }
新: if ((env.environment ?? "local") === "local" && env.environmentExplicit === true) { return http(ローカルフォールバック) }
```

- `environmentExplicit !== true` のとき step4 を skip → step5 の既存 throw（fail-closed）。
- `environmentExplicit === true` のときだけ明示 local 開発として localhost fallback を許可する。
- throw メッセージは既存の `"...API transport unresolved..."` を維持（`apps/web/src/app/error.tsx` の error boundary が補足）。新規 localhost リテラルを足さない。

### `describeTransport` 実装（Phase 4 §1・phase-2 §4）

```ts
export function describeTransport(t: ApiTransport): ApiTransportDescriptor {
  if (t.kind === "service-binding") {
    return { transportKind: "service-binding", baseHost: new URL(SERVICE_BINDING_ORIGIN).host };
  }
  return { transportKind: "http", baseHost: new URL(t.baseUrl).host };
}
```

既存定数 `SERVICE_BINDING_ORIGIN` と `t.baseUrl`（ランタイム値）から `URL.host` を抽出するのみ。**新規 localhost/8787/8888 リテラルを足さない**（`verify-no-localhost-bake` gate）。

### `authed.ts` 配線（phase-2 §3）

```ts
import { getAuthEnv, getEnvironmentResolution, getTransportRuntimeIsTest } from "@/lib/env";
import { AuthRequiredError, FetchAuthedError } from "./errors";
import { describeTransport, fetchViaApiTransport, resolveApiFetch } from "./transport";

const env = getAuthEnv();
const resolution = getEnvironmentResolution();
const transport = resolveApiFetch({
  API_SERVICE: env.API_SERVICE,
  baseUrl: env.INTERNAL_API_BASE_URL,
  environment: resolution.environment,
  environmentExplicit: resolution.explicit,
  isTest: getTransportRuntimeIsTest(),
});
const transportDescriptor = describeTransport(transport);
const res = await fetchViaApiTransport(transport, path, { ...init, headers, cache: "no-store" });
if (res.status === 401) throw new AuthRequiredError();
if (!res.ok) {
  const text = await res.text().catch(() => "");
  throw new FetchAuthedError(res.status, text, transportDescriptor);
}
return (await res.json()) as T;
```

- 既存の cookie 転送・accept ヘッダ・path 検証ロジックは不変。
- 既存 `import { getEnvironment }` は `getEnvironmentResolution` へ置換（authed.ts 内では `getEnvironment` を使わなくなる。env.ts 側の `getEnvironment` 自体は他参照向けに残す）。
- `ApiTransportError` は `fetchViaApiTransport` で生成し、message は固定概要、host・kind は `transport` に保持する。cookie/secret/memberId は含めない。

## 入出力・副作用

- `describeTransport`: 純関数・副作用なし。
- `resolveApiFetch`: 純関数・副作用なし。fail-closed 時は throw（error boundary が補足）。
- `FetchAuthedError`/`ApiTransportError`: 値オブジェクト。診断メタは `transport` に保持する。
- `authed.ts` の `fetchAuthed`: 副作用 = 上流 API への HTTP/service-binding 呼び出し（cookie 転送）。公開シグネチャ `fetchAuthed<T>(path, init?)` は不変。

## テスト方針（Phase 4 §6 T1/T3 に厳密一致）

### transport.spec.ts（T1）
- T1-1: `resolveApiFetch({ environment: "local", environmentExplicit: false })` → throw（`/API transport unresolved/`）。
- T1-2: `{ environment: "local", environmentExplicit: true }` → `{ kind:"http", baseUrl: LOCAL_API_FALLBACK_BASE_URL }`。
- T1-3: `{ environment: "staging" }`（binding/baseUrl 無）→ throw（`/API transport unresolved/`）。
- T1-4: `{ API_SERVICE: binding, environmentExplicit: false }` → service-binding（fail-closed 不発）。
- T1-5: `describeTransport({ kind:"service-binding", fetch })` → `{ transportKind:"service-binding", baseHost: new URL(SERVICE_BINDING_ORIGIN).host }`。
- T1-6: `describeTransport({ kind:"http", baseUrl:"https://ubm-hyogo-api-staging.daishimanju.workers.dev" })` → `{ transportKind:"http", baseHost:"ubm-hyogo-api-staging.daishimanju.workers.dev" }`。
- 既存ケース（"allows localhost fallback only for local" / "fails closed for staging ..." 等）は改修後も同一期待値で green（後方互換）。

### authed.spec.ts（T3）
- 既存 mock（`@/lib/env`）に `getEnvironmentResolution` を追加（`getEnvironment` mock は残置可）。`beforeEach` で `getEnvironmentResolution` を `{ environment:"local", explicit:true }` 既定に。
- T3-1: service-binding 経由で 410 → `FetchAuthedError`・`status===410`・`transport.transportKind==="service-binding"`・`transport.baseHost===new URL(SERVICE_BINDING_ORIGIN).host`。
- T3-2: http baseUrl 経由で 500 → `FetchAuthedError`・`transport.transportKind==="http"`・`transport.baseHost===<baseUrl の host>`。
- T3-3: fetch throw（network・service-binding 経路）→ `ApiTransportError`・`transport.transportKind==="service-binding"`・`transport.baseHost` 付き・`cause` に元 error。
- T3-4/T3-5: 既存「401 で AuthRequiredError」「200 で JSON 返却 + cookie 転送」が回帰ゼロ。
- T3-6: `getEnvironmentResolution` を `{ local, false }` + binding/baseUrl 無 → fetchAuthed が throw（fail-closed 配線確認）。
- 既存「source から process.env 直参照と 127.0.0.1 を排除する」検査は維持（authed.ts に新規 localhost リテラルを足さない）。

TDD: 各ケース RED → 実装 → GREEN。

## ローカル実行・検証コマンド

```bash
mise exec -- pnpm exec vitest run \
  apps/web/src/lib/fetch/transport.spec.ts \
  apps/web/src/lib/fetch/authed.spec.ts \
  apps/web/src/lib/fetch/__tests__/transport-select.spec.ts
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-no-localhost-bake.sh --src-only
git diff --stat -- apps/api   # 空であること
```

## 完了条件(DoD)

- [ ] `resolveApiFetch` が Phase 4 §3.2 真理値表（R-1〜R-8）を満たす。特に R-7（`environmentExplicit=false` × binding/baseUrl 無 × local 暗黙化 → throw）が green。
- [ ] `describeTransport` が D-1〜D-3 を満たし、新規 localhost リテラルを焼かない。
- [ ] `FetchAuthedError` constructor が後方互換（既存 `new FetchAuthedError(status, bodyText)` 不変）で、optional meta を保持できる。
- [ ] `ApiTransportError` が export され、`transport`/`cause` を保持。
- [ ] `authed.ts` が `getEnvironmentResolution` で fail-closed を配線し、非2xx に `FetchAuthedError` 診断メタ・fetch throw に `ApiTransportError` を付与（T3-1〜3）。
- [ ] T1/T3 全ケース green・既存回帰ゼロ。
- [ ] typecheck / lint green。`verify-no-localhost-bake --src-only` green。`apps/api` diff 空。
