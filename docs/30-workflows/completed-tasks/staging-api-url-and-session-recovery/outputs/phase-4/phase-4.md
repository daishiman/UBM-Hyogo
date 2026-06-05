# Phase 4: テスト作成（TDD Red）

## 目的

実装前に失敗するテスト（Red）を確定する。3 lane の受入条件（AC-1〜AC-8）を
source-level の自動テストで先に固定し、Phase 5 実装を「テストが緑になる」ゴールへ収束させる。

> **不変条件 #8**: 新規テストは `*.spec.ts` のみ（`*.test.ts` 禁止・lefthook `block-test-suffix` / CI `verify-test-suffix` が reject）。
> **SIGKILL/OOM 回避（FB-UI-02-2）**: vitest は必ず対象ファイルを**明示指定**で実行する（`apps/web` 全件実行禁止）。

## 追加 / 編集するテストファイル一覧

| # | パス | 種別 | lane | 対象 AC |
|---|------|------|------|---------|
| 1 | `apps/web/src/lib/fetch/transport.spec.ts` | **新規** | A | AC-1/2/3 |
| 2 | `apps/web/src/lib/fetch/authed.spec.ts` | 編集 | A | AC-1/2/4 |
| 3 | `apps/web/app/api/me/[...path]/route.route.spec.ts` | **新規** | A | AC-1/2/4 |
| 4 | `apps/web/src/lib/fetch/public.spec.ts` | 編集 | B | AC-3/4 |
| 5 | `apps/web/src/lib/__tests__/env.spec.ts` | 編集 | B | AC-4 |
| 6 | `scripts/verify-no-localhost-bake.spec.ts` | **新規** | C | AC-5 |

> 命名: 既存 auth route が `*.route.spec.ts` 接尾辞（`*.spec.ts` を満たす）。me proxy spec も同接尾辞に倣う（task-a §4-3）。

## Red ケース一覧

### 1. `transport.spec.ts`（`resolveApiFetch` 5 分岐網羅・純関数・mock 不要）

| ケース | 入力 | 期待 |
|--------|------|------|
| TC-A1 | `{ isTest:true, baseUrl:"https://mock.test", API_SERVICE:{fetch} }` | `{ kind:"http", baseUrl:"https://mock.test" }`（(a) test+baseUrl が binding に優先） |
| TC-A2 | `{ API_SERVICE:{fetch}, environment:"staging" }` | `{ kind:"service-binding", fetch }`（(b) binding 優先） |
| TC-A3 | `{ baseUrl:"http://localhost:8787", environment:"local" }`（binding 無・非 test） | `{ kind:"http", baseUrl:"http://localhost:8787" }`（(c)） |
| TC-A4 | `{ environment:"local" }`（全無） | `{ kind:"http", baseUrl:"http://localhost:8787" }`（(d) local fallback） |
| TC-A5 | `{ environment:"staging" }`（全無・非 local） | `toThrow(/unresolved/)`（(e) fail-closed） |
| TC-A6（境界） | `{ isTest:true, API_SERVICE:{fetch}, environment:"staging" }`（baseUrl 無） | `{ kind:"service-binding", fetch }`（(a) は baseUrl 必須 → (b) へ落ちる） |

### 2. `authed.spec.ts`（編集）

mock を `getApiBaseEnv`（spec:17-19）→ `getAuthEnv` / `getEnvironment` / `getTransportRuntimeIsTest` へ更新。
既存 13 ケース（path 検証 / cookie 転送 / 200 / 401 / 403 / 500 / network-fail / 末尾 / 除去 / headers マージ / source grep）は意味を保ったまま `getAuthEnv` ベースへ読み替え。
既存 spec:120-148 の「`PUBLIC_API_BASE_URL` fallback」ケースは authed では使われなくなるため「binding 無 + INTERNAL 無 + 非 local → throw」へ置換。

追加:

| ケース | 内容 | 期待 |
|--------|------|------|
| TC-B1 | `getAuthEnv` が `API_SERVICE` を返す（staging 相当） | `binding.fetch` が `https://service-binding.local/me` で呼ばれ、global `fetch` 未使用 |
| TC-B2 | binding 経由で 401 / 非 2xx | `AuthRequiredError`（401）/ `FetchAuthedError`（非 2xx）を throw |
| TC-B3 | `fetchAuthed("/me/x?cursor=abc")` | 呼ばれた URL に `?cursor=abc` を含む（binding / http 双方） |
| TC-B4 | source grep（既存 spec:159-166 維持 + 拡張） | `authed.ts` に `process.env[` と `127.0.0.1` が無い。`transport.ts` にも同 grep を追加（local fallback は `localhost:8787` で `127.0.0.1` 不使用） |

### 3. `me route.route.spec.ts`（新規）

`getAuth`（session）と `getAuthEnv` / `getEnvironment` / `getTransportRuntimeIsTest` を mock。

| ケース | 内容 | 期待 |
|--------|------|------|
| TC-C1 | 未認証（memberId 無） | 401 `{code:"UNAUTHENTICATED"}`（`requireSession` 維持） |
| TC-C2 | 認証済 + `API_SERVICE` あり | `binding.fetch` が `https://service-binding.local/me/...` で呼ばれ、global `fetch` 未使用（loopback 回避の核） |
| TC-C3 | `GET /api/me/foo?a=1` | upstream subpath に `/me/foo?a=1`（search 保持） |
| TC-C4 | req に `cookie` / `content-type` | transport の init.headers に forward |
| TC-C5 | 非 test + binding 無 + 非 local（staging で env 欠落） | `resolveApiFetch` throw が proxy で表面化（500 か throw・実装挙動に合わせ assert） |

### 4. `public.spec.ts`（編集・Lane B）

既存 reset/mock 構造（spec:6-29）に `NEXT_PUBLIC_API_BASE_URL` / `ENVIRONMENT` の cleanup を追加。`cloudflareEnv` 型に両キー追加。

| ケース | 内容 | 期待 |
|--------|------|------|
| TC-D1 | `NEXT_PUBLIC_API_BASE_URL` と `PUBLIC_API_BASE_URL` 双方 set・`ENVIRONMENT=local`・binding 不在 | fetch URL が `NEXT_PUBLIC` 由来（PUBLIC より優先） |
| TC-D2 | base URL 不在・`ENVIRONMENT=local`・binding 不在 | fetch URL が `http://localhost:8787` |
| TC-D3 | base URL 不在・`ENVIRONMENT=staging`・binding 不在 | `rejects.toThrow(/unresolved in non-local/)`（fail-closed） |

> throw 検証は binding 不在条件で行う（binding があると `getServiceBinding()`（public.ts:35-41）が先に返り `getBaseUrl()` に到達しない）。

### 5. `env.spec.ts`（編集・Lane B）

| ケース | 内容 | 期待 |
|--------|------|------|
| TC-E1 | `getPublicFetchEnv({ NEXT_PUBLIC_API_BASE_URL:"https://api.example.com" })` | 戻り値に `NEXT_PUBLIC_API_BASE_URL:"https://api.example.com"` を含む |
| TC-E2 | `process.env.NEXT_PUBLIC_API_BASE_URL` 注入 + client 相当（`getCloudflareContext()` throw） | `NEXT_PUBLIC_API_BASE_URL` が解決される |

### 6. `verify-no-localhost-bake.spec.ts`（新規・Lane C self-test）

fixture dir を生成し gate の検出能力を検証（task-c §4）:

| ケース | fixture | 期待 |
|--------|---------|------|
| TC-F1 | `tmp/fixture-dirty/bake.js` = `const u="http://127.0.0.1:8787/x"` | gate exit 1（検出） |
| TC-F2 | `tmp/fixture-clean/ok.js` = `const u="https://api.example.workers.dev"` | gate exit 0 |
| TC-F3 | `tmp/fixture-allow/env.ts` = `const f="http://localhost:8787" // localhost-allow:local-fallback` | gate exit 0（allowlist 許容） |
| TC-F4 | `localhost:8888` を含む fixture | gate exit 1（`:8888` だけでなく検出範囲が `:8787`/localhost に拡張されたことの確認＝AC-5） |

## 既存 contract spec への影響（更新必須）

- `app/api/auth/magic-link/route.route.spec.ts:50-58`（`falls back to local API ... 127.0.0.1:8787`）: local fallback が **`localhost:8787` へ変わる**ため期待値を `http://localhost:8787/auth/magic-link` に更新。または env mock で `environment:"local"` を明示。
- `verify/route.route.spec.ts` / `magic-link/route.route.spec.ts` の INTERNAL 明示ケース: test 実行時 `NODE_ENV==="test"` で (a) 経路 HTTP に落ちるため、`INTERNAL_API_BASE_URL` 明示時は従来 URL のまま通る。実装者は 3 route spec を再実行し **127.0.0.1 期待のみ localhost へ更新**。
- `callback/email/route.route.spec.ts`（verify-magic-link 呼出）: `apiBaseUrl`/`fetchImpl` override 経路を維持したため影響なしの想定。要再実行確認。

## Red 状態の確定（このフェーズの完了判定）

実装前に上記 spec を置くと **transport.ts 未作成 / `getEnvironment` 等未定義 / `getBaseUrl` 旧挙動 / gate script 未作成**により対象 spec が fail する。
この「期待された fail」を Phase 4 の成果（Red）とする。グリーン化は Phase 5。

## vitest 実行コマンド（対象明示）

```bash
# Lane A
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  src/lib/fetch/transport.spec.ts src/lib/fetch/authed.spec.ts \
  app/api/me/'[...path]'/route.route.spec.ts \
  app/api/auth/magic-link/route.route.spec.ts \
  app/api/auth/magic-link/verify/route.route.spec.ts \
  app/api/auth/callback/email/route.route.spec.ts

# Lane B
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  src/lib/fetch/public.spec.ts src/lib/__tests__/env.spec.ts

# Lane C self-test
mise exec -- pnpm vitest run scripts/verify-no-localhost-bake.spec.ts
```
