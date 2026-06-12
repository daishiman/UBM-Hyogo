# Phase 4: I/O 契約

## メタ情報
正本: `outputs/phase-4/phase-4.md` / 上位 SSOT: `../../_shared-context.md`

参照: `../phase-1/phase-1.md`（AC-1〜9）/ `../phase-2/phase-2.md`（§3 fail-closed・§4 describeTransport・§5 ログ拡張）/ `../phase-3/phase-3.md`（結合点契約固定の指示）

## 目的
唯一の結合点（transport 解決 → 診断メタ → error → ログ）を I/O 契約として固定し、各 spec（T1-T5）の期待値表に落とす。本 Phase の表が実装・テストのグラウンドトゥルースであり、Phase 5 以降の task-NN はこれを参照する。

---

## 1. `describeTransport` の I/O 表（SSOT §5・phase-2 §4 の具体化）

入力 `ApiTransport`（判別 union）から `ApiTransportDescriptor` を生成する純関数。`baseHost` は新規リテラルを焼かず、既存定数 `SERVICE_BINDING_ORIGIN` と `t.baseUrl`（ランタイム値）から `new URL(...).host` で抽出する。

| # | 入力 `ApiTransport` | 出力 `transportKind` | 出力 `baseHost`（host のみ・scheme/path 無） | 由来 |
|---|---------------------|----------------------|-----------------------------------------------|------|
| D-1 | `{ kind: "service-binding", fetch }` | `"service-binding"` | `new URL(SERVICE_BINDING_ORIGIN).host` の値（= service-binding 固定 origin の host 部） | 既存定数 `SERVICE_BINDING_ORIGIN` |
| D-2 | `{ kind: "http", baseUrl: "https://ubm-hyogo-api-staging.daishimanju.workers.dev" }` | `"http"` | `ubm-hyogo-api-staging.daishimanju.workers.dev` | ランタイム `t.baseUrl` を `new URL().host` |
| D-3 | `{ kind: "http", baseUrl: <ローカルフォールバック定数> }`（local 開発時のみ生成され得る） | `"http"` | `<ローカルフォールバック定数>` を `new URL().host` で抽出した host 部 | 既存定数 `LOCAL_API_FALLBACK_BASE_URL`（新規リテラルを足さない） |

注: `baseHost` は **host（hostname + port）のみ**。scheme・path・query・cookie・secret を含めない。これは AC-3（ログに host とステータスのみ）の前提を満たすための契約。

---

## 2. `getEnvironmentResolution` の入出力表（SSOT §5・phase-2 §3 env.ts 側）

入力は `RawEnv`（省略時 `readRawEnv()`）。判定対象は `rawEnv["ENVIRONMENT"]` のみ。enum 3値に**厳密一致**するときだけ `explicit=true`。

| # | `rawEnv["ENVIRONMENT"]` の値 | 出力 `environment` | 出力 `explicit` | 備考 |
|---|------------------------------|--------------------|------------------|------|
| E-1 | `"staging"` | `"staging"` | `true` | enum 厳密一致 |
| E-2 | `"production"` | `"production"` | `true` | enum 厳密一致 |
| E-3 | `"local"` | `"local"` | `true` | enum 厳密一致（明示 local 開発） |
| E-4 | `undefined`（未注入） | `"local"` | `false` | フォールバック。fail-closed の入力になる |
| E-5 | `"stagin"` 等の typo / 型不一致（数値・空文字等） | `"local"` | `false` | enum 不一致は全て `{ local, false }` |

不変条件: `getEnvironment(rawEnv)` の戻り値は本関数の `environment` と常に同値（後方互換）。`getEnvironment` 自体は変更しない（phase-2 §3）。`getEnvironmentResolution` は `getEnvironment` を内部利用して `environment` を得てもよいが、`explicit` 判定は enum 厳密一致を独自に行う。

---

## 3. `resolveApiFetch` 改修後の解決順序表と fail-closed 真理値表（SSOT §5・phase-2 §3）

### 3.1 解決順序（上から評価・最初に一致した行で確定）

| step | 条件 | 戻り値 | 既存比 |
|------|------|--------|--------|
| 1 | `isTest === true` かつ `baseUrl` 有 | `{ kind: "http", baseUrl }` | 不変 |
| 2 | `API_SERVICE !== undefined` | `{ kind: "service-binding", fetch: API_SERVICE.fetch }` | 不変（staging は通常ここで解決） |
| 3 | `baseUrl` 有 | `{ kind: "http", baseUrl }` | 不変 |
| 4 | `(environment ?? "local") === "local"` **かつ** `environmentExplicit === true` | `{ kind: "http", baseUrl: <ローカルフォールバック定数> }` | **改修**: 明示 local のときだけ許可 |
| 5 | 上記いずれも不一致 | `throw Error("...API transport unresolved...")` | fail-closed |

`environmentExplicit` は新規 optional フィールド。localhost fallback は `getEnvironmentResolution()` が `ENVIRONMENT=local` を明示検出した `true` のときだけ許可する。省略時 `undefined` と `false` は step4 を skip して step5 throw へ進め、暗黙 local 化を fail-closed にする。

### 3.2 fail-closed 真理値表（`environmentExplicit` × `API_SERVICE` × `baseUrl` × `environment`）

`isTest` は省略（`undefined`）とする。step1 は別途（isTest=true × baseUrl）でのみ発火。

| # | `environmentExplicit` | `API_SERVICE` | `baseUrl` | `environment` | 確定 step | 結果 |
|---|------------------------|---------------|-----------|----------------|-----------|------|
| R-1 | `undefined`（省略） | 有 | 無 | 任意 | 2 | service-binding |
| R-2 | `false` | 有 | 無 | 任意 | 2 | service-binding（binding 優先なので fail-closed まで行かない＝回帰なし） |
| R-3 | `undefined` | 無 | 有 | 任意 | 3 | http(baseUrl) |
| R-4 | `false` | 無 | 有 | 任意 | 3 | http(baseUrl) |
| R-5 | `undefined`（legacy direct caller） | 無 | 無 | `"local"` | 5 | throw（明示 local でないため fail-closed） |
| R-6 | `true` | 無 | 無 | `"local"` | 4 | http(ローカルフォールバック)（明示 local 開発で許可） |
| R-7 | **`false`** | **無** | **無** | `"local"`（暗黙 local 化） | **5** | **throw（fail-closed）← 本タスクの核心** |
| R-8 | 任意 | 無 | 無 | `"staging"` / `"production"` | 5 | throw（既存挙動・非 local は元から throw） |

R-7 が「ENVIRONMENT 未注入で暗黙 local 化した staging/production で、binding も baseUrl も欠落」というシナリオ。改修前は step4 で localhost に到達していた穴を、`environmentExplicit=false` で step5 throw に塞ぐ。

---

## 4. `server_fetch_failed` ログの出力キー契約（SSOT §5・phase-2 §5・AC-1/2/3）

`logServerFetchFailure` が `console.error("server_fetch_failed", {...})` で出力するオブジェクトのキー契約。

| キー | 型 | 出力条件 | 値の由来 |
|------|----|----------|----------|
| `code` | `string` | 常時 | `SafeResultError.code`（例 `MEMBER_SESSION_410` / `MEMBER_SESSION_FAILED`） |
| `path` | `string` | 常時（`logPath` 指定時のみログ自体が発火） | `opts.logPath`（例 `/me`） |
| `status` | `number \| null` | 常時 | `code` 末尾の `_(\d{3})` から抽出。無ければ `null` |
| `transportKind` | `"service-binding" \| "http"` | **元 error が `transport` メタを持つときのみ**（spread 条件付き） | `transportFromError(originalError)` → `SafeResultError.transport` |
| `baseHost` | `string` | **元 error が `transport` メタを持つときのみ**（spread 条件付き） | 同上 |

**出力禁止キー（不変条件 #11・AC-3）**: `memberId` / `cookie` / `secret` / `token` / `authorization` / リクエストボディ。これらは一切ログに含めない。T4 で `JSON.stringify(calls)` に対し禁止語が含まれないことを検査する。

互換性: 診断メタを持たない error（既存の汎用 Error 等）では `transportKind` / `baseHost` キー自体が出力オブジェクトに**現れない**（spread が空）。これにより既存テスト（`{code, path, status}` のみを期待）の回帰がゼロになる（AC-8）。

---

## 5. `FetchAuthedError` / `ApiTransportError` の診断メタ shape（SSOT §5・phase-2 §3 配線）

### 5.1 `FetchAuthedError`（非 2xx 応答を包む既存クラスの拡張）

| プロパティ | 型 | 必須 | 意味 |
|------------|----|------|------|
| `status` | `number` | 必須（既存） | HTTP ステータス |
| `bodyText` | `string` | 必須（既存） | 応答ボディ（既存どおり。secret/memberId を含む可能性があるためログには出さない） |
| `transport` | `{ transportKind: "service-binding" \| "http"; baseHost: string }` | optional（追加） | 解決した transport 種別と host |

後方互換: 既存 constructor `new FetchAuthedError(status, bodyText)` は不変。診断メタは optional 第3引数 `transport?: ApiTransportDescriptor` で `error.transport` に保持する（省略時は従来どおり診断メタなし）。

### 5.2 `ApiTransportError`（transport 接続失敗 = fetch throw を診断付きで包む新規クラス）

| プロパティ | 型 | 必須 | 意味 |
|------------|----|------|------|
| `message` | `string` | 必須 | 失敗概要（host・kind を含むが secret は含めない） |
| `transport` | `{ transportKind: "service-binding" \| "http"; baseHost: string }` | 必須 | 解決した transport 種別と host |
| `cause` | `unknown` | optional | 元の throw（`fetch` が投げた TypeError 等） |

`safe-fetch.ts` は `ApiTransportError` を `statusFromError` で status 抽出できない（status を持たない）ため `MEMBER_SESSION_FAILED` に正規化する。`transportFromError` が `error.transport.transportKind` / `error.transport.baseHost` を読み取り、ログでは `transportKind` / `baseHost` としてフラットに出す（AC-7）。

> 診断メタ生成の責務は **transport.ts の `describeTransport` に一元化**（phase-2 §2）。`FetchAuthedError`/`ApiTransportError` は受け取って保持するだけ。`safe-fetch.ts` は読み取って出力するだけ。生成ロジックを分散させない。

---

## 6. テスト期待値表（T1-T5・SSOT §4 テスト表の具体化）

各ケースは「テストケースID・入力・期待出力」を一意に固定する。実装はこの表を満たすこと。

### T1: `apps/web/src/lib/fetch/transport.spec.ts`（追加ケース）

| ケースID | 入力 | 期待出力 |
|----------|------|----------|
| T1-1 | `resolveApiFetch({ environment: "local", environmentExplicit: false })`（R-7 相当・binding/baseUrl 無） | `throw`（`/API transport unresolved/` にマッチ） |
| T1-2 | `resolveApiFetch({ environment: "local", environmentExplicit: true })`（R-6） | `{ kind: "http", baseUrl: <ローカルフォールバック定数> }` |
| T1-3 | `resolveApiFetch({ environment: "staging" })`（R-8・binding/baseUrl 無） | `throw`（`/API transport unresolved/` にマッチ） |
| T1-4 | `resolveApiFetch({ API_SERVICE: binding, environmentExplicit: false })`（R-2） | `{ kind: "service-binding", fetch: binding.fetch }`（binding 優先・fail-closed 不発） |
| T1-5 | `describeTransport({ kind: "service-binding", fetch })`（D-1） | `{ transportKind: "service-binding", baseHost: new URL(SERVICE_BINDING_ORIGIN).host }` |
| T1-6 | `describeTransport({ kind: "http", baseUrl: "https://ubm-hyogo-api-staging.daishimanju.workers.dev" })`（D-2） | `{ transportKind: "http", baseHost: "ubm-hyogo-api-staging.daishimanju.workers.dev" }` |

既存ケース（"allows localhost fallback only for local" 等）は**改修後も同じ期待値で green**であること（後方互換確認）。

### T2: `apps/web/src/lib/fetch/__tests__/transport-select.spec.ts`（追加ケース）

> 注: 当ファイルは `transport-select.ts`（`selectAndFetch` 等）専用。SSOT §4 T2 は「service-binding 優先で localhost 不到達」「staging explicit でも binding なし時の挙動」を要求する。`transport-select.ts` の責務外の `resolveApiFetch` ケースは T1 で担保済みのため、T2 は当ファイル既存挙動の回帰確認に留め、`resolveApiFetch` 系の新規ケースは T1 に集約する（重複回避）。実装時に当ファイルへ追加が不要と判断した場合はその旨を task-01 に記す。

| ケースID | 入力 | 期待出力 |
|----------|------|----------|
| T2-1 | 既存「selects service binding before HTTP fallback」 | 回帰ゼロ（既存期待値維持・binding 優先で globalFetch 未呼出） |
| T2-2 | 既存「returns base-unavailable without calling fetch」 | 回帰ゼロ（fetch 未呼出） |

### T3: `apps/web/src/lib/fetch/authed.spec.ts`（追加ケース）

`getEnvironmentResolution` を mock する（`@/lib/env` の mock に追加）。

| ケースID | 入力 | 期待出力 |
|----------|------|----------|
| T3-1 | service-binding 経由で非 2xx（例 410）応答 | `FetchAuthedError` が throw され、`status===410` かつ `transport.transportKind==="service-binding"` かつ `transport.baseHost===new URL(SERVICE_BINDING_ORIGIN).host` |
| T3-2 | http baseUrl 経由で非 2xx（例 500）応答 | `FetchAuthedError` で `transport.transportKind==="http"`・`transport.baseHost===<baseUrl の host>` |
| T3-3 | fetch が throw（network error）・service-binding 経路 | `ApiTransportError` が throw され `transport.transportKind==="service-binding"`・`transport.baseHost` 付き・`cause` に元 error |
| T3-4 | 既存「401 で AuthRequiredError」 | 回帰ゼロ（AuthRequiredError・診断メタ不要） |
| T3-5 | 既存「200 で JSON を返し cookie を転送」 | 回帰ゼロ |
| T3-6 | `getEnvironmentResolution` が `{ local, false }`・binding/baseUrl 無 | `resolveApiFetch` が throw → fetchAuthed が throw（fail-closed が authed に配線されている確認） |

注: 既存テストは `getEnvironment` を mock している。本タスクで authed.ts が `getEnvironmentResolution` を使う配線に変えるため、既存 mock に `getEnvironmentResolution` を追加する。`getEnvironment` mock は残置可（後方互換）。

### T4: `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts`（追加ケース）

| ケースID | 入力（throw する error） | 期待 `console.error("server_fetch_failed", {...})` |
|----------|---------------------------|----------------------------------------------------|
| T4-1 | `Object.assign(new Error("fetchAuthed failed: 410"), { status: 410, transport: { transportKind: "service-binding", baseHost: "service-binding.local" } })`・`{ codePrefix:"MEMBER_SESSION", logPath:"/me" }` | `{ code:"MEMBER_SESSION_410", path:"/me", status:410, transportKind:"service-binding", baseHost:"service-binding.local" }` |
| T4-2 | `Object.assign(new Error("transport failed"), { transport: { transportKind:"http", baseHost:"ubm-hyogo-api-staging.daishimanju.workers.dev" } })`・同 opts | `{ code:"MEMBER_SESSION_FAILED", path:"/me", status:null, transportKind:"http", baseHost:"ubm-hyogo-api-staging.daishimanju.workers.dev" }` |
| T4-3（回帰） | 診断メタ無し error（既存「logs structured diagnostics」相当・status=410 のみ） | `{ code:"MEMBER_SESSION_410", path:"/me", status:410 }`（`transportKind`/`baseHost` キーが現れない＝従来形維持） |
| T4-4（漏洩検査） | T4-1 と同 error に `memberId`/`cookie` を仮に付与しても | `JSON.stringify(errorSpy.mock.calls)` に `memberId` / `cookie` / `secret` / `token` が含まれない |

注: T4-1/T4-2 の `baseHost` 値はテスト用の文字列リテラルだが、これは**ログ出力検証のための error メタ値**であり transport.ts への新規焼き込みではない。spec ファイル内の文字列であり `verify-no-localhost-bake --src-only` のスコープ（src の本体コード）には抵触しない（`service-binding.local` は localhost リテラルでもない）。

### T5: `apps/web/src/lib/__tests__/env.spec.ts`（追加ケース）

| ケースID | 入力 `rawEnv` | 期待 `getEnvironmentResolution` 出力 |
|----------|----------------|---------------------------------------|
| T5-1 | `{ ENVIRONMENT: "staging" }`（E-1） | `{ environment: "staging", explicit: true }` |
| T5-2 | `{ ENVIRONMENT: "production" }`（E-2） | `{ environment: "production", explicit: true }` |
| T5-3 | `{ ENVIRONMENT: "local" }`（E-3） | `{ environment: "local", explicit: true }` |
| T5-4 | `{}`（ENVIRONMENT 未注入・E-4） | `{ environment: "local", explicit: false }` |
| T5-5 | `{ ENVIRONMENT: "stagin" }`（typo・E-5） | `{ environment: "local", explicit: false }` |

---

## 統合テスト連携
本 Phase で固定した「transport descriptor・ログ shape・error 診断メタ・解決順序」を各 spec の期待値（T1-T5）として落とした。Phase 6/7 はこの表に対する fail-path / カバレッジ拡充、Phase 9 は `verify-no-localhost-bake --src-only` と `apps/api` 非接触で締める。実機統合（staging `/me` 応答の真因確定）は Phase 11 の手動手順（`wrangler tail` を `scripts/cf.sh` 経由）で代替する。

## 参照資料
- `../../_shared-context.md`（SSOT §4 変更対象 / §5 シグネチャ）
- `../phase-1/phase-1.md`（AC-1〜9）/ `../phase-2/phase-2.md`（fail-closed・describeTransport・ログ拡張）/ `../phase-3/phase-3.md`（結合点契約固定）
- 実コード: `apps/web/src/lib/fetch/transport.ts` / `authed.ts` / `errors.ts`、`apps/web/src/lib/env.ts`、`apps/web/src/lib/server-fetch/safe-fetch.ts`

## 成果物
- `outputs/phase-4/phase-4.md`

## 完了条件
- [x] `describeTransport` の I/O 表（D-1〜3）を固定した。
- [x] `getEnvironmentResolution` の入出力表（E-1〜5）を固定した。
- [x] `resolveApiFetch` の解決順序表と fail-closed 真理値表（R-1〜8）を固定した。
- [x] `server_fetch_failed` ログの出力キー契約（許可キー / 禁止キー）を固定した。
- [x] `FetchAuthedError` / `ApiTransportError` の診断メタ shape を固定した。
- [x] テスト期待値表（T1-1〜T5-5）を固定した。
