# Task B: client bundle の localhost 焼き込み根絶（NEXT_PUBLIC_API_BASE_URL 統一）

- **[実装区分: 実装仕様書]**
- **implementation_mode: new**
- **workflow**: `docs/30-workflows/completed-tasks/staging-api-url-and-session-recovery/`
- **lane**: Lane B（phase-2.md §「Lane B 設計: client bundle の localhost 焼き込み根絶」）
- **CONST_007**: Lane A / Lane B / Lane C すべて **1 実装サイクル / 1 PR** に同梱する。本仕様書はそのうち Lane B 分のみを記述する。

---

## 0. このタスクで何を直すのか（根本原因・確定済み）

ステージング環境で「API のアドレスがローカルホスト（`http://localhost:8787`）になってしまう」事象。
アプリ内に**実在する唯一の localhost 焼き込み**は次の 1 箇所:

```
apps/web/src/lib/fetch/public.ts:21
  const DEFAULT_BASE_URL = "http://localhost:8787";
```

これが client runtime で fallback に踏まれる理由（チェーン）:

1. `public.ts:23-25` `getBaseUrl()` は `getPublicFetchEnv().PUBLIC_API_BASE_URL ?? DEFAULT_BASE_URL` を返す。
2. client が参照する `PUBLIC_API_BASE_URL` は **`NEXT_PUBLIC_` 接頭辞が無い**変数。
3. Next.js は **`NEXT_PUBLIC_` 接頭辞の変数だけ**を build 時に client bundle へ inline する。接頭辞無しの `PUBLIC_API_BASE_URL` は client bundle に焼き込まれない。
4. その結果 client runtime では `process.env.PUBLIC_API_BASE_URL` が `undefined`、かつ `getCloudflareContext()` は server 専用で client では throw（→ `readCloudflareEnv()` が `undefined` を返す `env.ts:80-87`）。
5. `getPublicFetchEnv()` が `PUBLIC_API_BASE_URL` を解決できず `undefined` → `getBaseUrl()` が `DEFAULT_BASE_URL = "http://localhost:8787"` に落ちる（`public.ts:24`）。

> **注（スコープ外）**: ブラウザ console に出る `127.0.0.1:8888` 到達や Sentry 警告は**ブラウザ拡張由来**でアプリのコードとは無関係。本 Lane の対象は `:8787` の **localhost fallback の根絶**のみ。

### このタスクのゴール
client bundle が参照する API base URL を **`NEXT_PUBLIC_API_BASE_URL`（build 時 inline）** に統一し、localhost fallback を **local 環境限定のガード**に閉じる。staging / production の client bundle に `localhost:8787` が一切現れない状態にする。

---

## 1. 後続実装者向け予備知識: `NEXT_PUBLIC_` の inline 機構（中学生にもわかる例え）

学校のプリント（= client bundle = ブラウザに配られる JS）を印刷するとき、`NEXT_PUBLIC_` で始まる名前の値は「印刷の段階（build 時）でプリントに直接刷り込まれる」ので、家に持ち帰った後（= ブラウザで動く時）でもそのまま読める。
一方 `NEXT_PUBLIC_` が付いていない名前（例: `PUBLIC_API_BASE_URL`）は「先生だけが持っている職員室の名簿（= server だけが読める Cloudflare の変数）」に書いてあるだけなので、プリントには刷り込まれず、家（ブラウザ）からは見えない。
今は client が「職員室の名簿」を読もうとして読めず、しかたなく予備の住所「localhost:8787」を使ってしまっている。だから client が読む値を、必ず「プリントに刷り込まれる」`NEXT_PUBLIC_API_BASE_URL` に切り替える。これが本タスクの本質。

---

## 2. 依存関係（重要）

- 本 Lane は `getEnvironment()`（`"local" | "staging" | "production"` を返す env.ts の新規アクセサ）を**参照**する。
- **`getEnvironment()` は Lane A（task-a）が `apps/web/src/lib/env.ts` に新規追加する**（phase-2.md §A-4: `env.ts` 追記、`ENVIRONMENT` が `staging`/`production` のときその値、それ以外は `local`）。
- 1 PR 内で Lane A と Lane B が同梱されるため、Lane B が `getEnvironment()` を参照することは依存上 OK。
- **Lane B 単体実装時の注意**: もし実装順が Lane A より先になる場合は、`getEnvironment()` を参照する行をコメントで `// depends: Lane A getEnvironment()` と明記し、Lane A 着地後に解決する。Lane B 単体で `getEnvironment()` を別途定義してはならない（重複定義による drift 防止）。

---

## 3. CONST_005 6 項目

### 3-1. 変更ファイル一覧（変更種別）

| # | ファイル | 種別 | 変更内容 |
|---|---------|------|---------|
| 1 | `apps/web/src/lib/fetch/public.ts` | 編集 | `getBaseUrl()` を NEXT_PUBLIC 優先 + local 限定 fallback + 非 local throw（fail-closed）に改修 |
| 2 | `apps/web/src/lib/env.ts` | 編集 | `PublicFetchEnv` interface に `NEXT_PUBLIC_API_BASE_URL?: string` 追加 / `getPublicFetchEnv()` で process.env・rawEnv 双方から解決 |
| 3 | `apps/web/wrangler.toml` | 確認・整理 | `NEXT_PUBLIC_API_BASE_URL` が `[vars]` / `[env.staging.vars]` / `[env.production.vars]` に存在することを確認（現状あり=維持）。`PUBLIC_API_BASE_URL` は後方互換のため残置 |
| 4 | `.github/workflows/web-cd.yml` | 確認 | build env に `NEXT_PUBLIC_API_BASE_URL` が staging/production 両 build step で渡っていることを確認（現状あり=維持） |
| 5 | `apps/web/src/lib/fetch/public.spec.ts` | 編集 | NEXT_PUBLIC 優先解決 / local fallback / 非 local throw の spec 追加 |
| 6 | `apps/web/src/lib/__tests__/env.spec.ts` | 編集 | `getPublicFetchEnv()` が `NEXT_PUBLIC_API_BASE_URL` を返す spec 追加 |

> 不変条件: env 参照は **`env.ts` の公開アクセサ経由のみ**（CLAUDE.md task-02 wrangler-env-injection）。`public.ts` から `process.env.*` を直接参照しない。本改修も `getPublicFetchEnv()` / `getEnvironment()` 経由を維持する。

### 3-2. シグネチャ / 構造

#### (a) `public.ts` `getBaseUrl()` 改修後

```ts
// シグネチャ不変。内部解決ロジックのみ変更。
function getBaseUrl(): string;
```

- `DEFAULT_BASE_URL` 定数（`public.ts:21`）は **local 分岐内のリテラル**へ移すか、`// localhost-allow:local-fallback` allowlist コメント付きで残す（Lane C の grep gate `verify-no-localhost-bake.sh` allowlist 対象。phase-2.md §C-3）。

#### (b) `env.ts` `PublicFetchEnv` interface 拡張

```ts
export interface PublicFetchEnv {
  API_SERVICE?: ServiceBinding;
  NEXT_PUBLIC_API_BASE_URL?: string;   // ← 追加（build inline / client で解決可能）
  PUBLIC_API_BASE_URL?: string;        // 既存（server-only / 後方互換）
  NODE_ENV?: string;
  PLAYWRIGHT_TEST?: string;
}
```

#### (c) `env.ts` `getPublicFetchEnv()` 改修後

```ts
export function getPublicFetchEnv(rawEnv: RawEnv = readRawEnv()): PublicFetchEnv;
// 戻り値に NEXT_PUBLIC_API_BASE_URL を含めるよう拡張（後述 Before/After）。
```

### 3-3. 入出力 / 副作用

- **client bundle inline 機構**: `NEXT_PUBLIC_API_BASE_URL` は build 時に client bundle へ inline されるため、client runtime の `process.env.NEXT_PUBLIC_API_BASE_URL` で値が解決できる。`PUBLIC_API_BASE_URL`（非接頭辞）は inline されず client では空。
- **NEXT_PUBLIC vs 非接頭辞の違い**: `NEXT_PUBLIC_*` = client+server 両方で解決可（build 焼き込み）。非接頭辞 = server runtime（Cloudflare `[vars]` / process.env）のみ解決可。
- **fail-closed throw**: base URL も binding も無く、かつ環境が非 local（staging/production）の場合は **throw**。silent な localhost fallback を禁止（AC-3）。throw は `apps/web/src/app/error.tsx`（task-05 error boundary）で補足される設計（CLAUDE.md invariant）。
- 副作用は無し（純粋な値解決のみ）。`fetch` の発火は呼び出し側 `doFetch`（`public.ts:56-78`）が担う。

### 3-4. テスト方針

新規 test ファイルは作らず、既存 spec に追記する（不変条件 #8: `*.spec.ts` のみ・`*.test.ts` 禁止）。

**`apps/web/src/lib/fetch/public.spec.ts`（追記）**
- `NEXT_PUBLIC_API_BASE_URL` が set されているとき、http-fallback の URL が `NEXT_PUBLIC_API_BASE_URL` 由来になる（`PUBLIC_API_BASE_URL` より優先）。
- `NEXT_PUBLIC_API_BASE_URL` も `PUBLIC_API_BASE_URL` も無く `ENVIRONMENT=local` のとき、http-fallback の URL が `http://localhost:8787`。
- `NEXT_PUBLIC_API_BASE_URL` も `PUBLIC_API_BASE_URL` も無く `ENVIRONMENT=staging`（非 local）のとき、`getBaseUrl()` 経路が **throw** する（service binding 不在を前提に http-fallback へ落ちる組み立てで検証）。
  - 注: service binding がある場合は `getServiceBinding()`（`public.ts:35-41`）が先に binding を返すため `getBaseUrl()` には到達しない。throw 検証は binding 不在条件で行う。

**`apps/web/src/lib/__tests__/env.spec.ts`（追記）**
- `getPublicFetchEnv({ NEXT_PUBLIC_API_BASE_URL: "https://api.example.com" })` が `{ NEXT_PUBLIC_API_BASE_URL: "https://api.example.com" }` を含んで返す。
- `process.env.NEXT_PUBLIC_API_BASE_URL` 注入時に client 相当（`getCloudflareContext()` throw）でも `NEXT_PUBLIC_API_BASE_URL` が解決される。

**vitest 対象指定（最小実行）**
```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  src/lib/fetch/public.spec.ts src/lib/__tests__/env.spec.ts
```

### 3-5. ローカル実行 / 検証コマンド

```bash
# 1. 型チェック
mise exec -- pnpm typecheck

# 2. lint（NEXT_PUBLIC 統一・HEX 等は対象外だが style gate）
mise exec -- pnpm lint

# 3. 対象 vitest
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  src/lib/fetch/public.spec.ts src/lib/__tests__/env.spec.ts

# 4. AC-4 検証: src 配下の localhost 焼き込みが local fallback の 1 箇所(allowlist)のみであること
grep -rn "localhost:8787\|127.0.0.1:8787" apps/web/src \
  | grep -v "localhost-allow:local-fallback"
#   → 0 件（allowlist コメント付き local 分岐以外に出ないこと）

# 5. AC-4 build bundle 検証（staging build 相当・client bundle に localhost が出ないこと）
ENVIRONMENT=staging \
NEXT_PUBLIC_API_BASE_URL=https://ubm-hyogo-api-staging.daishimanju.workers.dev \
PUBLIC_API_BASE_URL=https://ubm-hyogo-api-staging.daishimanju.workers.dev \
INTERNAL_API_BASE_URL=https://ubm-hyogo-api-staging.daishimanju.workers.dev \
AUTH_URL=https://ubm-hyogo-web-staging.daishimanju.workers.dev \
SENTRY_ENVIRONMENT=staging NEXT_PUBLIC_SENTRY_ENVIRONMENT=staging \
SENTRY_TRACES_SAMPLE_RATE=0.2 NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.2 \
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare
grep -rn "localhost:8787\|127.0.0.1:8787" apps/web/.open-next/assets/*.js \
  apps/web/.open-next/**/*.js 2>/dev/null
#   → 0 件（staging client bundle に localhost が一切混入しないこと）
```

> 注: build bundle grep（手順 5）は Lane C の grep gate `verify-no-localhost-bake.sh`（phase-2.md §C-3）が CI で機械化する。Lane B 単体検証では上記手動 grep を実施する。

### 3-6. DoD（完了条件）

- [ ] **AC-4**: staging build の client bundle（`.open-next/assets/*.js`）に `localhost:8787` / `127.0.0.1:8787` が**現れない**（手順 5 の grep が 0 件）。
- [ ] **AC-3**: localhost への到達は **local 環境のみ**。staging/production runtime で base URL も binding も無い場合は throw（fail-closed・silent fallback なし）。
- [ ] `apps/web/src` 配下の localhost リテラルは allowlist コメント `// localhost-allow:local-fallback` 付きの local 分岐 1 箇所のみ（手順 4 の grep）。
- [ ] `mise exec -- pnpm typecheck` 緑。
- [ ] `mise exec -- pnpm lint` 緑。
- [ ] 対象 vitest（`public.spec.ts` / `env.spec.ts`）緑。
- [ ] env 参照が `env.ts` アクセサ経由のみ（`public.ts` から `process.env.*` 直接参照なし）。

---

## 4. Before / After スニペット

### 4-1. `apps/web/src/lib/fetch/public.ts`

**Before（`public.ts:21`, `:23-25`）**
```ts
const DEFAULT_BASE_URL = "http://localhost:8787";

function getBaseUrl(): string {
  return getPublicFetchEnv().PUBLIC_API_BASE_URL ?? DEFAULT_BASE_URL;
}
```

**After**
```ts
import { getPublicFetchEnv, getEnvironment } from "../env"; // getEnvironment は Lane A 追加(env.ts §A-4)

// localhost-allow:local-fallback — local `next dev`(service binding 不在)の最終 fallback 専用
const LOCAL_FALLBACK_BASE_URL = "http://localhost:8787";

function getBaseUrl(): string {
  const env = getPublicFetchEnv();
  // NEXT_PUBLIC_API_BASE_URL は build 時 client bundle へ inline されるため client でも解決可能。
  // PUBLIC_API_BASE_URL は server-only(非 inline)。NEXT_PUBLIC を優先し後方互換で fallback。
  const url = env.NEXT_PUBLIC_API_BASE_URL ?? env.PUBLIC_API_BASE_URL;
  if (url) return url;
  // local 限定の最終 fallback。非 local では silent localhost を禁止し fail-closed で throw。
  if (getEnvironment() === "local") return LOCAL_FALLBACK_BASE_URL;
  throw new Error(
    "public fetch: API base URL unresolved in non-local runtime " +
      "(NEXT_PUBLIC_API_BASE_URL must be set for staging/production)",
  );
}
```

> import 行は既存 `import { getPublicFetchEnv } from "../env";`（`public.ts:19`）に `getEnvironment` を追加する形へ変更する。

### 4-2. `apps/web/src/lib/env.ts` — `PublicFetchEnv` interface

**Before（`env.ts:61-66`）**
```ts
export interface PublicFetchEnv {
  API_SERVICE?: ServiceBinding;
  PUBLIC_API_BASE_URL?: string;
  NODE_ENV?: string;
  PLAYWRIGHT_TEST?: string;
}
```

**After**
```ts
export interface PublicFetchEnv {
  API_SERVICE?: ServiceBinding;
  NEXT_PUBLIC_API_BASE_URL?: string; // build inline / client で解決可能(優先)
  PUBLIC_API_BASE_URL?: string;      // server-only / 後方互換
  NODE_ENV?: string;
  PLAYWRIGHT_TEST?: string;
}
```

### 4-3. `apps/web/src/lib/env.ts` — `getPublicFetchEnv()`

**Before（`env.ts:155-172`）**
```ts
export function getPublicFetchEnv(rawEnv: RawEnv = readRawEnv()): PublicFetchEnv {
  const processEnv = readProcessEnv();
  const baseUrl =
    typeof processEnv["PUBLIC_API_BASE_URL"] === "string"
      ? processEnv["PUBLIC_API_BASE_URL"]
      : typeof rawEnv["PUBLIC_API_BASE_URL"] === "string"
        ? rawEnv["PUBLIC_API_BASE_URL"]
        : undefined;
  const binding = rawEnv["API_SERVICE"];
  return {
    ...(binding === undefined ? {} : { API_SERVICE: binding as ServiceBinding }),
    ...(baseUrl === undefined ? {} : { PUBLIC_API_BASE_URL: baseUrl }),
    ...(typeof processEnv["NODE_ENV"] === "string" ? { NODE_ENV: processEnv["NODE_ENV"] } : {}),
    ...(typeof processEnv["PLAYWRIGHT_TEST"] === "string"
      ? { PLAYWRIGHT_TEST: processEnv["PLAYWRIGHT_TEST"] }
      : {}),
  };
}
```

**After**
```ts
export function getPublicFetchEnv(rawEnv: RawEnv = readRawEnv()): PublicFetchEnv {
  const processEnv = readProcessEnv();
  // NEXT_PUBLIC_API_BASE_URL は build inline。client では process.env、server では rawEnv で解決。
  const nextPublicBaseUrl =
    typeof processEnv["NEXT_PUBLIC_API_BASE_URL"] === "string"
      ? processEnv["NEXT_PUBLIC_API_BASE_URL"]
      : typeof rawEnv["NEXT_PUBLIC_API_BASE_URL"] === "string"
        ? rawEnv["NEXT_PUBLIC_API_BASE_URL"]
        : undefined;
  // PUBLIC_API_BASE_URL は server-only(非 inline)。後方互換のため引き続き解決。
  const baseUrl =
    typeof processEnv["PUBLIC_API_BASE_URL"] === "string"
      ? processEnv["PUBLIC_API_BASE_URL"]
      : typeof rawEnv["PUBLIC_API_BASE_URL"] === "string"
        ? rawEnv["PUBLIC_API_BASE_URL"]
        : undefined;
  const binding = rawEnv["API_SERVICE"];
  return {
    ...(binding === undefined ? {} : { API_SERVICE: binding as ServiceBinding }),
    ...(nextPublicBaseUrl === undefined ? {} : { NEXT_PUBLIC_API_BASE_URL: nextPublicBaseUrl }),
    ...(baseUrl === undefined ? {} : { PUBLIC_API_BASE_URL: baseUrl }),
    ...(typeof processEnv["NODE_ENV"] === "string" ? { NODE_ENV: processEnv["NODE_ENV"] } : {}),
    ...(typeof processEnv["PLAYWRIGHT_TEST"] === "string"
      ? { PLAYWRIGHT_TEST: processEnv["PLAYWRIGHT_TEST"] }
      : {}),
  };
}
```

### 4-4. `apps/web/wrangler.toml` — 確認のみ（変更不要・現状維持）

`NEXT_PUBLIC_API_BASE_URL` は既に 3 ブロックすべてに存在（変更不要）:
- `[vars]`: `wrangler.toml:16`
- `[env.staging.vars]`: `wrangler.toml:32`
- `[env.production.vars]`: `wrangler.toml:60`

`PUBLIC_API_BASE_URL`（`wrangler.toml:17, 33, 61`）は server-only 経路の後方互換のため**残置**（即削除しない＝drift 回避。削除は未タスク候補）。

### 4-5. `.github/workflows/web-cd.yml` — 確認のみ（変更不要・現状維持）

build env に `NEXT_PUBLIC_API_BASE_URL` が両 build step で渡っていることを確認（変更不要）:
- staging build step env: `web-cd.yml:35`
- production build step env: `web-cd.yml:180`

> build env に NEXT_PUBLIC を渡すことが client bundle inline の前提。ここが欠けると client bundle に値が焼き込まれず localhost fallback へ戻る。**この行は削除禁止**。

### 4-6. テスト Before/After（追記イメージ）

**`apps/web/src/lib/fetch/public.spec.ts`（追記・local 環境模擬）**
```ts
it("http-fallback: NEXT_PUBLIC_API_BASE_URL を PUBLIC_API_BASE_URL より優先する", async () => {
  cloudflareEnv.NEXT_PUBLIC_API_BASE_URL = "https://api.next-public.example";
  cloudflareEnv.PUBLIC_API_BASE_URL = "https://api.legacy.example";
  cloudflareEnv.ENVIRONMENT = "local"; // binding 不在 → http-fallback
  mockFetchOnce({ ok: true });
  await fetchPublic("/health");
  expect(globalThis.fetch).toHaveBeenCalledWith(
    "https://api.next-public.example/health",
    expect.anything(),
  );
});

it("http-fallback: base URL 不在 + local は localhost:8787 へ落ちる", async () => {
  cloudflareEnv.ENVIRONMENT = "local"; // base URL なし・binding なし
  mockFetchOnce({ ok: true });
  await fetchPublic("/health");
  expect(globalThis.fetch).toHaveBeenCalledWith(
    "http://localhost:8787/health",
    expect.anything(),
  );
});

it("非 local で base URL も binding も無いと throw(fail-closed)", async () => {
  cloudflareEnv.ENVIRONMENT = "staging"; // base URL なし・binding なし
  await expect(fetchPublic("/health")).rejects.toThrow(/unresolved in non-local/);
});
```
> 既存の reset/mock 構造（`public.spec.ts:6-29`）に `NEXT_PUBLIC_API_BASE_URL` / `ENVIRONMENT` の cleanup を追加すること。`cloudflareEnv` 型に両キーを足す。

**`apps/web/src/lib/__tests__/env.spec.ts`（追記）**
```ts
it("getPublicFetchEnv: NEXT_PUBLIC_API_BASE_URL を返す", () => {
  const env = getPublicFetchEnv({
    NEXT_PUBLIC_API_BASE_URL: "https://api.example.com",
  });
  expect(env.NEXT_PUBLIC_API_BASE_URL).toBe("https://api.example.com");
});
```

---

## 5. 実装時の苦戦しやすい箇所（後続実装者への申し送り）

1. **`getServiceBinding()` が先に走る点**: staging/production runtime では `getServiceBinding()`（`public.ts:35-41`）が `API_SERVICE` を返すため、`getBaseUrl()` に到達しない（service-binding 経路）。つまり本改修の throw は「binding も NEXT_PUBLIC も無い異常時」の保険。throw 検証 spec は binding 不在を必ず明示する。
2. **`readRawEnv()` の PLAYWRIGHT 上書き**（`env.ts:94-106`）: Playwright e2e は process.env を優先する分岐がある。`getPublicFetchEnv` は別途 `readProcessEnv()` を直接見るため（`env.ts:156`）、NEXT_PUBLIC も process.env 優先で読む実装に揃えること（上記 After）。
3. **`DEFAULT_BASE_URL` 定数名**: Lane C の grep gate allowlist は `// localhost-allow:local-fallback` コメントで識別する。定数名は任意だが allowlist コメントを必ず同一行か直前行に置く。
4. **env 不変条件**: `public.ts` 内で `process.env.NEXT_PUBLIC_API_BASE_URL` を直接読まないこと。必ず `getPublicFetchEnv()` 経由。直接参照は task-18 regression grep と CLAUDE.md invariant #11 系に抵触する。
5. **Lane A 未着地時のコンパイル**: `getEnvironment()` が未定義だと typecheck が落ちる。1 PR 同梱が原則だが、Lane B を先に書く場合は Lane A の `getEnvironment()` stub を env.ts に置いてから（または Lane A 着地を待ってから）typecheck を回す。
