# Phase 4: I/O契約・テスト設計

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `profile-me-404-authenticated-admin-recovery` |
| Phase | 4 / 13 |
| 前提 | Phase 3 GO 判定済み（設計レビュー 4 条件 ✅） |
| taskType | implementation |
| implementation_mode | `edit`（error-handler / safe-fetch / diagnose 編集 + api-cd.yml 新規） |
| visualEvidence | VISUAL_ON_EXECUTION（復旧後 screenshot は user-gated） |
| workflow_state | `implemented_local_runtime_pending` |
| SSOT | `_shared-context.md` |

## 目的

Phase 2 で確定した多層防御設計（T01〜T04）を、実装がそのまま RED→GREEN で進められる **I/O 契約表・ログ payload 契約・job 契約・RED 観点（実装前に落ちるべきテスト一覧）** へ落とし込む。各契約は SSOT §2〜§4・実コード（`error-handler.ts:86`・`safe-fetch.ts:69`・`web-cd.yml`・`apps/api/src/index.ts:216`）に即して、入力 × 出力 × 副作用 × secret 非出力根拠を 1 行ずつ固定する。

> 不変原則: 応答 body・status 体系・UI 文言・`/me` の path/shape を一切変えず、**観測フィールドの追加・CD 新設・診断強化のみ**を行う（AC-6）。

## 実行タスク

### 4.1 T01 — `notFoundHandler` 構造化診断ログの payload 契約（AC-2 / D-B）

対象: `apps/api/src/middleware/error-handler.ts:86`（`notFoundHandler`）。現状は `ApiError(code:"UBM-1404")` を生成し `errorHandler(err, c)`（同 :41）へ委譲、`errorHandler` が `logError(payload)`（`@ubm-hyogo/shared/logging`）を呼ぶ。`notFoundHandler` 側で `ApiError` の `context` に診断フィールドを載せ、`errorHandler` の既存経路（:79 `if (apiError.log.context !== undefined) payload.context = apiError.log.context;`）でログへ伝播させる。

#### 4.1.1 notFound 診断ログ payload 契約

`logError` が出力する構造化ログ（`StructuredLogInput`）に含まれる診断 `context` フィールド。`errorHandler` が常時付与する `code` / `status` / `method` / `path` は不変、`context` のみ T01 で追加する。

| フィールド | 型 | 例 | secret 非出力の根拠 |
| --- | --- | --- | --- |
| `code`（既存・不変） | `string` | `"UBM-1404"` | エラーコード定数。secret なし |
| `status`（既存・不変） | `number` | `404` | HTTP status。secret なし |
| `method`（既存・不変） | `string` | `"GET"` | リクエストメソッド。secret なし |
| `path`（既存・不変） | `string` | `"/me"` | `new URL(c.req.url).pathname`。query/cookie を含まない pathname のみ。secret なし |
| `context.reason`（T01 新規） | `string`（固定値 `"route_not_matched"`） | `"route_not_matched"` | 定数文字列。secret なし |
| `context.method`（T01 新規） | `string` | `"GET"` | `c.req.method`。secret なし |
| `context.path`（T01 新規） | `string` | `"/me"` | pathname のみ。secret なし |
| `context.hasAuthorization`（T01 新規） | `boolean` | `false` | `c.req.header("authorization") !== undefined` の **boolean 化のみ**。Authorization ヘッダ値・Bearer token を**出力しない**（AC-9） |
| `context.hasSessionCookie`（T01 新規） | `boolean` | `true` | `c.req.header("cookie")` が `__Secure-authjs.session-token` を含むかの **boolean 化のみ**。cookie 値・JWT 生文字列を**出力しない**（AC-9） |

> 二重防御: `@ubm-hyogo/shared/logging` の `logError` は `SENSITIVE_KEY_SUBSTRINGS`（`authorization` / `cookie` / `token` / `secret` 等）を含む context キーを `[REDACTED]` に置換する（`logging.spec.ts:89-94` で検証済）。T01 は **boolean フィールド名に `authorization`/`cookie` を含めない**（`hasAuthorization` / `hasSessionCookie`）ことで redaction の誤発火を避けつつ、値そのものを boolean 化して二重に secret 非漏洩を担保する。

#### 4.1.2 data-cause 切り分け表（ログのみで一意化・AC-2）

| 観測ログ | data-cause | 帰結 |
| --- | --- | --- |
| `code=UBM-1404` + `path=/me` + `hasSessionCookie=true` | **route 未マッチ（S1）**: 認証 cookie は届いているが api-staging が `/me` を route できていない | T02（api 自動 CD）で根治 |
| `code=UBM-1404` + `path=/me` + `hasSessionCookie=false` | cookie 未到達（transport / CSP / service-binding 経路） | S2 寄り。web ログ（T03）と突合 |
| `UBM-1404` の出力なし（401/410/500 が出る） | route は健全。認証/data 層事象（S3） | 本 WF スコープ外（#1192 / #1234 委譲） |

#### 4.1.3 不変条件（T01）

- 応答 body（`UBM-1404` の `application/problem+json`）・status `404`・headers（`x-request-id` / `x-trace-id`）は**一切変更しない**。
- `errorHandler` の既存ログフィールド（`code`/`status`/`method`/`path`/`traceId`/`requestId`）は不変。`context` のみ追加。

### 4.2 T03 — `server_fetch_failed` の route-404 ログ契約（AC-4）

対象: `apps/web/src/lib/server-fetch/safe-fetch.ts:69`（`logServerFetchFailure`）。現状 `console.error("server_fetch_failed", { code, path, status, ...transport })` を出す。`code` が `*_404` のとき `routeNotFound: true` を payload へ追加する（他は不変）。

#### 4.2.1 `server_fetch_failed` ログ payload 契約

| フィールド | 型 | 例 | 変更点 |
| --- | --- | --- | --- |
| `code`（既存・不変） | `string` | `"MEMBER_SESSION_404"` | `normalizeError` が `${codePrefix}_${status}` で生成 |
| `path`（既存・不変） | `string` | `"/me"` | `opts.logPath`。URL pathname 相当・secret なし |
| `status`（既存・不変） | `number \| null` | `404` | `error.code` 末尾 3 桁から抽出（`/_(\d{3})$/`） |
| `transportKind`（既存・不変） | `"service-binding" \| "http"` | `"service-binding"` | `error.transport` から spread（存在時のみ） |
| `baseHost`（既存・不変） | `string` | `"service-binding.local"` | `error.transport` から spread。host のみ・secret なし |
| `routeNotFound`（T03 新規） | `boolean`（`true` のみ付与） | `true` | `error.code` が `/_404$/` にマッチするときのみ `true` を追加。404 以外では**キー自体を出さない**（既存 payload 形状の最小変更） |

#### 4.2.2 route-404 判定とログ整合（S1/S2 切り分け）

| 観測 web ログ | 切り分け |
| --- | --- |
| `server_fetch_failed { code:"MEMBER_SESSION_404", routeNotFound:true, transportKind:"service-binding", baseHost:"service-binding.local" }` | service-binding 経路が 404 を返した = S2 寄り（version/path 不整合）。api notFound ログ（T01）と突合し route 層を確定 |
| `server_fetch_failed { code:"MEMBER_SESSION_404", routeNotFound:true, transportKind:"http", baseHost:"ubm-hyogo-api-staging.daishimanju.workers.dev" }` | http transport（INTERNAL/PUBLIC base）が 404。T01 の `UBM-1404 GET /me` と 1:1 対応 = S1 確定 |

#### 4.2.3 不変条件（T03）

- `normalizeError`（:49）の `code` 生成・`transport` 正規化、`statusFromError`、`AuthRequiredError` 経路は**不変**。
- `session-error-display.ts`（`MEMBER_SESSION_404` 文言）・`page.tsx` の redirect/notFound 分岐・`/me` の path/shape は**非接触**（AC-6）。挙動を変えず観測フィールドのみ追加。

### 4.3 T02 — `api-cd.yml` の job 契約（AC-3 / S1・D-A）

新規 `.github/workflows/api-cd.yml`。正本テンプレは `.github/workflows/web-cd.yml`。deploy 対象を `apps/api/wrangler.toml` に置換。

#### 4.3.1 トリガ・job topology 契約

| 項目 | 契約 |
| --- | --- |
| トリガ | `push` to `dev`（→ staging）/ `push` to `main`（→ production） |
| paths フィルタ | `apps/api/**` / `packages/shared/**` / `.github/workflows/api-cd.yml`（shared 型変更経由の api 挙動変化も発火。取りこぼし無しを過剰発火より優先） |
| concurrency | `group: api-cd-${{ github.ref_name }}` / `cancel-in-progress: true`（web-cd と同型） |
| permissions | `contents: read`（job-level secret 配置禁止・step-scoped のみ） |
| job: `deploy-staging` | `if: github.ref_name == 'dev'` / `environment.name: staging` |
| job: `deploy-production` | `if: github.ref_name == 'main'` / `environment.name: production` |
| job: `api-runtime-smoke` | `needs: deploy-staging` / `if: github.ref_name == 'dev'` / `environment.name: staging-runtime-smoke` |
| job: `api-runtime-smoke-production` | `needs: deploy-production` / `if: github.ref_name == 'main'` / `environment.name: production-runtime-smoke` |

#### 4.3.2 deploy step 契約

| 項目 | 契約 |
| --- | --- |
| deploy コマンド | staging: `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging`。production: 同 `--env production`。**`wrangler` 直叩き禁止**（CLAUDE.md / AC-7） |
| secret 渡し | `CLOUDFLARE_API_TOKEN` を **deploy step の step-scoped env のみ**で渡す（job-level 配置禁止・web-cd の安全パターン踏襲）。`CLOUDFLARE_ACCOUNT_ID` は `vars` |
| empty token guard | `if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then echo "::error::...";  exit 1; fi`（web-cd と同型） |
| build step | api は Cloudflare Workers の TS をそのまま deploy（OpenNext build 不要）。web-cd の `build:cloudflare` step は **api-cd には設けない**（`scripts/cf.sh deploy` が wrangler bundle を実施） |
| redaction-check | `bash scripts/redaction-check.sh --log api-cd-staging-deploy.log --account-id "$CLOUDFLARE_ACCOUNT_ID"`（web-cd と同型・deploy log の account-id マスク確認） |

#### 4.3.3 post-deploy smoke gate 契約（prereq skip 分岐）

| 項目 | 契約 |
| --- | --- |
| prereq skip 分岐 | `STAGING_AUTH_SECRET` / `STAGING_ADMIN_MEMBER_ID` / `STAGING_ADMIN_EMAIL` / `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` + 新規 `STAGING_API_BASE` のいずれか欠落で `printf '::notice::api runtime smoke skipped; missing ...'` → `skip_reason=missing:...` を `$GITHUB_OUTPUT` に書き **exit 0**（fail させない）。全揃いで `skip_reason=`（web-cd と同型） |
| probe-1（route 生存） | `GET {STAGING_API_BASE}/me/healthz` が **HTTP 200**（`apps/api/src/index.ts:216` `app.get("/me/healthz", ...)` が `{ok:true,scope:"me"}` を無認証で返す）。200 でなければ job fail |
| probe-2（認証 `/me` 到達） | `scripts/smoke/mint-staging-session-cookie.mts` で minted admin cookie を発行し `GET {STAGING_API_BASE}/me` を cookie 付きで叩く → **HTTP 200**。401/410/404 はいずれも fail（S1 検出: probe-1=200 かつ probe-2=404 = 「healthz は通るが /me が route 未マッチ」を CI が捕捉） |
| smoke runner | api 直 probe 用に `scripts/smoke/runtime-admin-api.sh` を新設（web smoke の `runtime-admin-web.sh` を雛形に、probe 先を api host の `/me/healthz` + `/me` に置換）。`mint-staging-session-cookie.mts` は流用 |
| cookie マスク | minted cookie は `echo "::add-mask::$cookie"` でマスクし `$GITHUB_ENV` に格納（web-cd と同型・stdout へ生値を出さない） |
| redaction grep gate | `if: always() && skip_reason == ''` で ci-evidence を `grep -rEl 'Cookie:\|authorization:\|Bearer ...\|__Secure-authjs\.session-token=...'` し、ヒット時 `::error::` + `exit 1`（web-cd の同型 grep を踏襲・AC-9） |
| evidence upload | `actions/upload-artifact@v4`（`api-runtime-smoke-staging-${{ github.run_id }}` / retention 30d・web-cd と同型） |

#### 4.3.4 不変条件（T02）

- `apps/api/wrangler.toml` の binding/vars は**参照のみ・変更しない**。deploy 対象 env 名は staging=`ubm-hyogo-api-staging`（:145）/ production=`ubm-hyogo-api`（:49）。
- smoke は **api 直 probe**（`/me/healthz` + 認証 `/me`）。web 経由 `/profile` smoke は web-cd の責務（重複させない）。

### 4.4 T04 — 診断 probe の入出力契約（AC-5）

対象: `scripts/diagnose-profile-session.sh`。read-only・冪等・secret 非出力。現状すでに `web_api_me_status`（web `/api/me/profile` proxy）・`api_me_status`（API direct `/me`）・`profile_data_cause`・`deployments_hint` を出力する。T04 は **route 存在差分（`/me/healthz` vs `/me`）** と **deploy parity hint** を追加する。

| 区分 | 契約 |
| --- | --- |
| 入力（env 変数） | `PROFILE_SESSION_BASE_URL`（web・既定 `https://ubm-hyogo-web-staging.daishimanju.workers.dev`）/ `PROFILE_SESSION_API_BASE_URL`（API direct・既定 `https://ubm-hyogo-api-staging.daishimanju.workers.dev`）/ `PROFILE_SESSION_COOKIE` ⊻ `PROFILE_SESSION_COOKIE_FILE`（排他・任意）/ `PROFILE_SESSION_CF_ENV`（既定 `staging`） |
| 出力（既存・不変） | `profile_session.web_api_me_status` / `.api_me_status` / `.profile_data_cause` / `.cookie_source` / `.candidate` / `.deployments_hint` / `.tail_hint` |
| 出力（T04 新規） | `profile_session.api_me_healthz_status=<3桁 or 000>`（`GET {API}/me/healthz` の status）/ `profile_session.api_route_diff=<healthz_alive_me_miss \| both_alive \| both_miss \| healthz_miss>`（healthz=200 かつ /me=404 → `healthz_alive_me_miss` = route 設定異常の sign）/ `profile_session.parity_hint=<bash scripts/cf.sh 経由の web↔api version 確認手順文字列>` |
| route 差分判定 | `api_me_healthz_status=200` かつ `api_me_status=404` → `api_route_diff=healthz_alive_me_miss`（S1 強シグナル）。`/me=401` → route 健全・認証層到達（`both_alive`） |
| exit code | `0`: 全 probe 実行完了（probe 先が 4xx/5xx/000 でも診断成功）/ `2`: cookie 二重指定等の usage 違反（既存 `exit 2` 維持）。curl 失敗は status `000` に正規化し exit 0（既存 `set +e` パターン維持） |
| 禁止（不変） | secret 実値・cookie 値・token・memberId を出力しない。`wrangler` 直叩きしない（version 確認は `bash scripts/cf.sh` 経由の**手順文字列を出力するのみ・実行しない** = read-only 維持）。書込・deploy なし（冪等） |

### 4.5 method 制約・境界値（横断）

| 項目 | 境界 | 根拠 |
| --- | --- | --- |
| transport fallback 対象 method | **GET / HEAD のみ**（大文字小文字非依存。`init?.method?.toUpperCase() ?? "GET"`） | `transport.ts:118` `canFallback`。`/me` 取得は GET ゆえ fallback 対象だが、HTTP エラー Response（404）では fallback しない（`transport.ts:130` の Response 返却分岐）= 404 は即 `MEMBER_SESSION_404` 確定（F-9） |
| notFound の status | 常に `404`（不変） | `error-handler.ts:93` `ApiError({code:"UBM-1404"})` の既定 status |
| `/me/healthz` の認証 | 不要（無認証 200） | `apps/api/src/index.ts:216`。probe-1 が cookie なしで 200 を期待できる根拠 |
| `routeNotFound` 付与境界 | `code` が `/_404$/` に**完全一致**するときのみ。`*_410` / `*_500` には付与しない | T03 §4.2.1 |
| diagnose route 差分の偽陽性回避 | `/me`（無認証）は健全でも **401** を返す（404 ではない）。`401` を route miss と誤判定しない | F-6・§4.4 |

### 4.6 RED 観点（実装前に最初に失敗するテスト一覧）

| TC-ID | ファイル（新規/編集） | RED の内容（実装前に fail） | GREEN 化タスク | 対応 AC / S / F |
| --- | --- | --- | --- | --- |
| NF-1 | `apps/api/src/middleware/error-handler.spec.ts`（新規） | `notFoundHandler` 呼び出し時の `logError` payload に `context.reason="route_not_matched"` が**含まれない**（現状 context 未付与） | T01 | AC-2 / F-7 / S1 |
| NF-2 | 同上 | cookie ヘッダ（`__Secure-authjs.session-token=...`）付き request で `context.hasSessionCookie=true` が出ない | T01 | AC-2 / S1 |
| NF-3 | 同上 | `authorization: Bearer ...` 付き request で `context.hasAuthorization=true` が出ない | T01 | AC-2 |
| NF-4（回帰 guard） | 同上 | 応答 body が `UBM-1404` / status `404`・cookie 生値が**ログに出ない**（boolean のみ）。実装後も GREEN 維持 | T01 | AC-6 / AC-9 |
| SF-1 | `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts`（編集） | `code:"MEMBER_SESSION_404"` の `logServerFetchFailure` 出力に `routeNotFound:true` が**無い** | T03 | AC-4 / S1 |
| SF-2（回帰 guard） | 同上 | `code:"MEMBER_SESSION_410"` 等で `routeNotFound` キーが**付かない**こと・既存 `transportKind`/`baseHost`/`status` 不変。実装後も GREEN | T03 | AC-6 |
| CD-1 | （vitest 外）`bash -n` + yaml 構文 | `.github/workflows/api-cd.yml` が**存在しない** | T02 | AC-3 |
| CD-2 | （vitest 外）yaml 文字列検査 | api-cd.yml に `bash scripts/cf.sh deploy --config apps/api/wrangler.toml` / `/me/healthz` probe / prereq skip 分岐 / redaction grep が**無い** | T02 | AC-3 / AC-9 |
| CD-3 | （vitest 外）`bash -n scripts/smoke/runtime-admin-api.sh` | api 直 probe runner が**存在しない**（または `/me/healthz` + 認証 `/me` 200 判定が無い） | T02 | AC-3 |
| DG-1 | （vitest 外）`bash -n` + 出力 key 検査 | 現行 diagnose に `api_me_healthz_status` / `api_route_diff` / `parity_hint` が**無い** | T04 | AC-5 |
| DG-2 | （vitest 外）redaction grep | diagnose 出力に cookie/token/memberId/secret が混入**しない**こと。実装後も GREEN | T04 | AC-5 / AC-9 |

> RED 運用: T01/T03 のログ payload テストは「先に spec を書き 1 度 RED を観測してから実装」。NF-4/SF-2/DG-2（回帰 guard）と既存 `page.spec.tsx` の 404 CTA 分岐は最初から GREEN が正で、実装後の GREEN 維持を Phase 9 で一括確認する。

## 統合テスト連携

4.1〜4.4 の契約と 4.6 の TC-ID を Phase 5 の task-01..04 の `テスト方針` 表へ展開し、Phase 6 で全ケース確定、Phase 7 で変更ブロック限定カバレッジ、Phase 9 で focused vitest + `bash -n` + yaml 構文 + redaction grep を一括 PASS、Phase 11 で staging 復旧（認証 `/me` 200）と data-cause 確定（user-gated）へ引き継ぐ。

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | 401/410 境界・session-resolve 契約（S3 切り分けの根拠） |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | `/me` の path/shape/status 体系不変（AC-6） |
| MVP 認証方針 | `docs/00-getting-started-manual/specs/13-mvp-auth.md` | session 未解決→401→redirect の正本（404 でないことの根拠） |

- `_shared-context.md` §1〜§8（確定事実・サブ原因・AC・inventory）
- `outputs/phase-2/phase-2.md` §2.2〜§2.5（T01〜T04 設計の正本）/ `outputs/phase-3/phase-3.md`（GO 判定）
- 実コード: `apps/api/src/middleware/error-handler.ts:86`（notFoundHandler）/ `apps/api/src/index.ts:216`（`/me/healthz`）/ `apps/web/src/lib/server-fetch/safe-fetch.ts:69`（logServerFetchFailure）/ `apps/web/src/lib/fetch/transport.ts:118`（canFallback）/ `.github/workflows/web-cd.yml`（api-cd テンプレ）/ `scripts/diagnose-profile-session.sh` / `scripts/smoke/mint-staging-session-cookie.mts`
- `packages/shared/src/logging.ts`（`SENSITIVE_KEY_SUBSTRINGS` 二重 redaction）

## 成果物

- 本ファイル `outputs/phase-4/phase-4.md`

## 完了条件

- [x] T01 notFound 構造化ログ payload 契約表（フィールド名・型・例・secret 非出力根拠＝boolean/status のみ）を固定
- [x] T03 `server_fetch_failed` の route-404 ログ契約（`routeNotFound:true` 追加・既存 transportKind/baseHost/status 同梱）を固定
- [x] T02 api-cd.yml の job 契約（トリガ dev/main・paths フィルタ・`scripts/cf.sh deploy --config apps/api/wrangler.toml` deploy・prereq skip 分岐・probe-1 `/me/healthz` 200・probe-2 minted-cookie 認証 `/me` 200・redaction grep gate）を固定
- [x] T04 診断 probe の入出力契約（route 差分 + parity hint・secret 非出力・read-only/冪等）を固定
- [x] 各タスクの RED 観点（NF / SF / CD / DG）を AC・S・F に紐づけて列挙
- [x] method 制約（GET/HEAD のみ fallback）・notFound status 404・`/me/healthz` 無認証 200 等の境界値を明記
