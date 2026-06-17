# Phase 6: テスト拡充

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `profile-me-404-authenticated-admin-recovery` |
| Phase | 6 / 13 |
| taskType | implementation |
| implementation_mode | `edit`（既存 error-handler / safe-fetch / diagnose script 編集 + api-cd.yml 新規） |
| visualEvidence | VISUAL_ON_EXECUTION（4 タスクとも UI 描画不変・NON_VISUAL） |
| workflow_state | `implemented_local_runtime_pending` |

## 目的

T01〜T04 の変更に対し、**`/me` 404 の data-cause を一意化する観測性**と**api 自動 CD + 認証 `/me` 200 smoke gate**を検証するテストケースを確定する。具体的には (1) notFound ログ payload（`hasSessionCookie` の true/false 両系・`UBM-1404` + method + path）、(2) safe-fetch の route-404 明示記録（`routeNotFound` true/false × 404/401/410 分岐）、(3) transport fallback の method 制約（GET/HEAD のみ・非冪等は fallback せず）、(4) api-cd.yml の prereq skip（secret 欠落時 skip）と probe-1（healthz 200）/ probe-2（認証 `/me` 200）の成功/失敗系、(5) diagnose script の route 存在差分（healthz=200 & /me=404 / /me=401）を網羅する。テストファイルは **SSOT §8 の inventory（既存 spec への追加 + 必要時の新規 `*.spec.ts`）に限定**し、`*.test.*` は作らない（不変条件 #8）。

## 実行タスク

### 6.1 テストファイルとケース群の対応（SSOT §8 inventory 準拠）

| ファイル | 追加/新規 | 追加ケース群 | タスク |
| --- | --- | --- | --- |
| `apps/api/src/middleware/error-handler.spec.ts` | 新規（無ければ作成・`*.spec.ts`） | NF-1〜NF-7 | T01 |
| `apps/web/src/lib/server-fetch/safe-fetch.spec.ts` | 新規（無ければ作成・`*.spec.ts`） | SF-1〜SF-6 | T03 |
| `apps/web/src/lib/fetch/authed.spec.ts`（または `transport.spec.ts`） | 編集（既存 chain 系へ追加） | MT-1〜MT-5 | T03 |
| `apps/web/app/(member)/profile/page.spec.tsx` | 編集（回帰固定） | PG-1〜PG-4 | T03 回帰 |
| `.github/workflows/api-cd.yml`（yaml 構文 + 分岐検査） | 新規対象の静的検証 | CD-1〜CD-6 | T02 |
| `scripts/diagnose-profile-session.sh`（`bash -n` + 出力 key 検査） | 編集対象の静的検証 | DG-1〜DG-5 | T04 |

> 実装着手時に既存 spec のファイル名・実パス（`apps/web/app/` であって `src/app/` ではない／`server-fetch/__tests__/` か `server-fetch/` 直下かを grep で再確認）を確定すること（SSOT §8 注記・命名ドリフト防止）。

### 6.2 T01: notFound 構造化診断ログ（NF 系・AC-2）

`notFoundHandler` が `errorHandler` 経由で `logError` を呼ぶ際、診断 context（`reason: "route_not_matched"`, `method`, `path`, `hasAuthorization: boolean`, `hasSessionCookie: boolean`）を付与することを検証する。**cookie 値・JWT 生文字列は出力せず boolean のみ**（AC-9）。`logError` を spy 化（`vi.spyOn`）し payload を assert する。

| ID | 観点 | 入力（Hono Context stub） | 期待 |
| --- | --- | --- | --- |
| NF-1 | route 未マッチ正本（hasSessionCookie=true） | `method=GET`, `path=/me`, `Cookie: __Secure-authjs.session-token=...` あり | `logError` payload に `code:"UBM-1404"`, `status:404`, `method:"GET"`, `path:"/me"`, `reason:"route_not_matched"`, `hasSessionCookie:true`, `hasAuthorization:false` を含む。応答 body は `UBM-1404` ApiError JSON・status 404 不変 |
| NF-2 | hasSessionCookie=false 系 | `path=/me`, cookie ヘッダ無し | payload `hasSessionCookie:false`・`hasAuthorization:false`。他は NF-1 と同型（cookie 有無で boolean のみ変化） |
| NF-3 | Authorization bearer 系 | `Authorization: Bearer ...` あり・cookie 無し | `hasAuthorization:true`, `hasSessionCookie:false`。**bearer の生値・token は payload に出ない**（boolean のみ） |
| NF-4 | method 透過 | `method=POST`, `path=/me/tags` | `method:"POST"`, `path:"/me/tags"` がそのまま出る（method/path は加工せず原文） |
| NF-5 | 不正 URL fallback | `c.req.url` が `URL` parse 不能 | `path` は `c.req.url` 原文 fallback（既存挙動）・例外を投げない・payload は出力される |
| NF-6 | secret 非出力（負方向・AC-9） | NF-1 の payload 全体 | payload の値文字列に `__Secure-authjs.session-token` の値・`memberId`・JWT 文字列・`Bearer` token 実値を**一切含まない**（boolean / method / path / code のみ） |
| NF-7 | 応答契約不変（AC-6） | NF-1 と同入力 | 返却 `Response` の status=404・body の `code` が `UBM-1404`・`detail` 文言が既存どおり（ログ追加で応答が変わらない回帰固定） |

> NF-1/NF-2 が **`hasSessionCookie` の true/false 両系**（タスク指定の必須網羅）。S1 の決定的 signal は「`hasSessionCookie=true` かつ `path=/me` の `UBM-1404`」= 認証 cookie は届いているが route 未マッチ、を NF-1 が固定する。

### 6.3 T03: safe-fetch route-404 の明示記録（SF 系・AC-4）

`logServerFetchFailure` が `code` の末尾 3 桁 status を抽出する既存ロジックに加え、**route-not-found（404）を明示する `routeNotFound` フラグ**を payload に含めることを検証する。`console.error("server_fetch_failed", {...})` を spy 化し、transport descriptor（`transportKind` / `baseHost`）の同梱は既存どおり維持する。

| ID | 観点 | 入力（`SafeResultError`） | 期待 |
| --- | --- | --- | --- |
| SF-1 | route-404（routeNotFound=true） | `code:"MEMBER_SESSION_404"`, `transport:{transportKind:"service-binding", baseHost:"..."}` | `server_fetch_failed` payload に `code`, `status:404`, `routeNotFound:true`, `transportKind`, `baseHost` を含む |
| SF-2 | 401 は routeNotFound=false | `code:"MEMBER_SESSION_401"` | payload `status:401`, `routeNotFound:false`（404 のみ true・401/410/5xx は false） |
| SF-3 | 410 は routeNotFound=false | `code:"MEMBER_SESSION_410"` | payload `status:410`, `routeNotFound:false` |
| SF-4 | status 抽出不能時 | `code:"MEMBER_SESSION_FAILED"`（transport throw・3桁無し） | `status:null`, `routeNotFound:false`（既存挙動維持・null status で誤って true 化しない） |
| SF-5 | transport descriptor 同梱維持（回帰） | SF-1 の入力 | `transportKind` / `baseHost` が既存 schema どおり flat 展開で出る（descriptor が落ちていない回帰固定） |
| SF-6 | logPath 無し時は無出力（回帰） | `opts.logPath` 未指定 | `console.error` が呼ばれない（既存 early return 維持） |

> SF-1/SF-2/SF-3 が **`routeNotFound` true/false 両系**（タスク指定の route-404 網羅）。S1（route 未マッチ）と S2（transport 経路差）を web ログだけで切り分けるための `routeNotFound:true` + `transportKind` の組合せを SF-1 が固定する。

### 6.4 T03: transport fallback の method 制約（MT 系・AC-4 横断）

#1237 の多段 fallback chain が **GET/HEAD のみ fallback し、非冪等 method（POST/PUT/PATCH/DELETE）は fallback せず即伝播**することを回帰固定する（本 WF の route-404 ログ追加で fallback 条件が侵食されていないことの guard）。`fetch` stub と `console.warn` spy で検証する。

| ID | 観点 | 入力 | 期待 |
| --- | --- | --- | --- |
| MT-1 | GET fallback 成功 | `GET`・binding が `ApiTransportError` throw → 次候補 200 | Response 200 + `api_transport_fallback` warn 1 回（fallback する） |
| MT-2 | HEAD fallback 成功 | `HEAD`・binding throw → 次候補 200 | Response 200 + warn（HEAD も冪等で fallback 許可） |
| MT-3 | POST 非 fallback | `POST`・binding throw・次候補あり | `ApiTransportError` 即伝播・warn なし（非冪等は fallback せず二重適用防止） |
| MT-4 | HTTP エラー Response 非 fallback | `GET`・binding が 404 **Response**（throw ではない） | 404 Response をそのまま返す・fallback なし・warn なし（HTTP エラーでは fallback しない＝404 が即 `MEMBER_SESSION_404` に至る F-9 の確定経路） |
| MT-5 | 全滅 rethrow | `GET`・全候補 `ApiTransportError` throw | 最後の `ApiTransportError` rethrow → 上位で `MEMBER_SESSION_FAILED`（既存正規化不変） |

> MT-3 が **非冪等は fallback しない**、MT-1/MT-2 が **GET/HEAD のみ fallback**（タスク指定の method 制約）。MT-4 が F-9 の「HTTP エラー応答（404 含む）では fallback しない＝404 即確定」を固定し、本 WF の観測対象である 404 がなぜ即表示に至るかをテストで担保する。

### 6.5 T03: /profile UI 回帰固定（PG 系・AC-6）

`/me` 結果に対する `/profile` の分岐・文言が**一切変わらない**ことを既存ケースの green 維持で確認する（UI 実装ファイル `session-error-display.ts` / `page.tsx` は非接触・spec への回帰追加のみ）。

| ID | `/me` 結果 | 期待（従来と同一・不変） |
| --- | --- | --- |
| PG-1 | 401（`AuthRequiredError`） | `redirect("/login?redirect=/profile")`・error 画面非描画（F-3 の redirect 経路不変） |
| PG-2 | 404（`MEMBER_SESSION_404`） | 「セッション情報を取得できませんでした」/「アカウント情報を確認できませんでした。再ログインしてください。」+ CTA「再ログイン」（F-1 の文言不変） |
| PG-3 | 410（`MEMBER_SESSION_410`） | 退会済み区別バナー・文言不変 |
| PG-4 | transport throw（`MEMBER_SESSION_FAILED`） | 通信経路失敗バナー文言不変（#1237 の文言を変えない） |

### 6.6 T02: api-cd.yml の静的検証（CD 系・AC-3）

`.github/workflows/api-cd.yml`（新規）を `web-cd.yml` 同型として yaml 構文 + ジョブ分岐で検証する（vitest 対象外・Phase 9 の actionlint / `python -c yaml.safe_load` + grep で担保）。

| ID | 観点 | 検査 | 期待 |
| --- | --- | --- | --- |
| CD-1 | yaml 構文妥当 | `python3 -c "import yaml,sys; yaml.safe_load(open(...))"`（または actionlint） | parse 成功・exit 0 |
| CD-2 | deploy 経路 | `deploy-staging`（`ref_name=='dev'`）/ `deploy-production`（`ref_name=='main'`）の存在 + deploy step が `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging`（/ production） | `wrangler` 直叩きなし・`scripts/cf.sh` 経由（grep `wrangler ` が deploy step に無い） |
| CD-3 | prereq skip（secret 欠落時 skip） | `STAGING_*` / `CLOUDFLARE_*` の missing 判定 step が `skip_reason` を `GITHUB_OUTPUT` に出し、後続 smoke step が `if: steps.prereq.outputs.skip_reason == ''` でガードされる | secret 欠落時は `::notice::` で skip・job は exit 0（fail させない・web-cd.yml 同型） |
| CD-4 | probe-1 成功/失敗系（healthz） | smoke step に `GET {API}/me/healthz` の 200 判定がある | 200 で pass / 非 200（例 404）で fail（route 層死活を CI が検出） |
| CD-5 | probe-2 成功/失敗系（認証 /me） | `mint-staging-session-cookie.mts` で minted cookie 発行 → `GET {API}/me`（または web 経由 `/profile`）が 200 | 200 で pass / 404 で fail。**probe-1 200 かつ probe-2 404 = S1（healthz は通るが /me notFound）を CI が fail 検出** |
| CD-6 | redaction grep gate | ci-evidence への `redaction grep gate` step が `__Secure-authjs.session-token` 等の漏洩を検出して fail | 漏洩検出時 `::error::` で fail・`if: always()`（web-cd.yml 同型） |

> CD-5 の「probe-1=200 / probe-2=404」分岐が S1 を CI で機械検出する本 WF の根治ゲート（AC-3）。secret 未設定の dev/fork では CD-3 の skip で fail させない。

### 6.7 T04: diagnose script の route 存在差分（DG 系・AC-5）

`scripts/diagnose-profile-session.sh` を `bash -n` + 出力 key 検査で検証する（read-only・冪等・secret 非出力）。route 存在差分（`/me/healthz` vs `/me`）と web↔api deploy parity を出力に含めることを固定する。

| ID | 観点 | 検査 | 期待 |
| --- | --- | --- | --- |
| DG-1 | 構文妥当 | `bash -n scripts/diagnose-profile-session.sh` | exit 0 |
| DG-2 | route 存在差分（healthz=200 & /me=404） | `GET {API}/me/healthz`=200 かつ `GET {API}/me`=404 のケースで判定ラベル | `candidate=api_route_not_matched`（healthz 生・/me notFound = S1 sign）相当のラベルを出力 |
| DG-3 | route 健全（/me=401） | `/me/healthz`=200 かつ `/me`（無認証）=401 | `candidate=unauthenticated_control` 相当（route 健全・認証層到達 = S1 否定） |
| DG-4 | 出力 key 固定（secret 非出力・AC-9） | 出力全行を grep | 出力に `cookie` 実値・`__Secure-authjs.session-token` の値・`memberId`・JWT・secret を**一切含まない**。`cookie_source` は `file`/`env`/`none` ラベルのみ |
| DG-5 | wrangler 直叩きなし（AC-7） | script 内の version/parity 確認が `bash scripts/cf.sh` 経由 hint 文字列のみ | `wrangler ` 直接呼び出しが無い（version 確認は hint 出力に留め read-only 維持） |

> DG-2/DG-3 が **healthz=200 & /me=404（S1）/ /me=401（route 健全）** の route 存在差分（タスク指定）。S3（真因が 401/410）と判明した場合はここで `unauthenticated_control` / `deleted_member_status` が出て本 WF スコープ外へ格下げ判断できる。

### 6.8 fail path と回帰 guard（網羅マトリクス）

| 軸 | route 未マッチ（S1） | transport 経路差（S2） | 認証/data（S3・スコープ外判定） |
| --- | --- | --- | --- |
| api ログ | NF-1（hasSessionCookie=true + UBM-1404） | NF-3（bearer 経路） | —（401/410 は session-guard 側・notFound に来ない） |
| web ログ | SF-1（routeNotFound=true + transportKind） | SF-1 の transportKind 値差 | SF-2 / SF-3（401/410 は routeNotFound=false） |
| CI gate | CD-5（probe-1 200 / probe-2 404 で fail） | CD-4（healthz 失敗） | CD-5 200 で pass（S3 は CI 緑） |
| diagnose | DG-2（healthz 200 / me 404） | DG-2 の API 直差分 | DG-3（me=401）/ 410 ラベル |

横断 guard: HTTP エラー非 fallback = MT-4。非冪等非 fallback = MT-3。401 redirect 回帰 = PG-1。PII 非出力 = NF-6 / SF-1 の負方向 / DG-4。応答契約不変 = NF-7 / PG-2。

**fail path（実装が誤った場合に赤くなるケース）**:
- notFound が cookie 実値を payload に入れる → NF-6 が fail（AC-9 NO-GO）。
- route-404 で `routeNotFound` を付け忘れ／401 にも付ける → SF-1 / SF-2 が fail。
- POST が fallback される → MT-3 が fail（二重適用 NO-GO）。
- HTTP 404 Response で fallback してしまう → MT-4 が fail（404 即確定の F-9 が崩れる）。
- prereq skip が無く secret 未設定で job fail → CD-3 が fail。
- probe-1 200 / probe-2 404 を pass 扱い → CD-5 が fail（S1 を見逃す）。
- diagnose が cookie/secret を出力 → DG-4 が fail（redaction NO-GO）。

### 6.9 実行補助コマンド（focused subset）

```bash
# api 側 notFound ログ
cd apps/api
mise exec -- pnpm exec vitest run src/middleware/error-handler.spec.ts
cd ../..

# web 側 route-404 ログ + method 制約 + UI 回帰（apps/web package 内・--root=../.. 形式）
cd apps/web
mise exec -- pnpm exec vitest run --root=../.. --config=vitest.config.ts \
  'apps/web/src/lib/server-fetch/safe-fetch.spec.ts' \
  apps/web/src/lib/fetch/authed.spec.ts \
  'apps/web/app/(member)/profile/page.spec.tsx'
cd ../..

# T02 / T04 は vitest 対象外（Phase 9 で yaml 構文 + bash -n + grep）
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/api-cd.yml'))"
bash -n scripts/diagnose-profile-session.sh
```

> 実 spec パス（`server-fetch/__tests__/` 配下か直下か、`error-handler.spec.ts` の新規要否）は実装着手時に grep で再確認し、不在なら `*.spec.ts` で新規作成する（`*.test.*` 禁止・不変条件 #8）。

## 統合テスト連携

本ケース表（NF / SF / MT / PG / CD / DG）を Phase 7 の変更ブロック限定カバレッジ（error-handler.ts notFoundHandler 周辺 / safe-fetch.ts logServerFetchFailure 周辺）で被覆判定し、Phase 9 の品質ゲート（typecheck / lint / focused vitest / `bash -n` / yaml 構文 / redaction grep / apps/api `/me` route 差分なし grep）で一括 PASS を確認する。staging 実機での S1/S2/S3 確定（probe-1/probe-2 実走）と認証 `/me` 200 復旧 screenshot は Phase 11（user-gated）。

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | 401/410 境界（NF / SF-2/SF-3 / PG-1 の正本） |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | `/me` shape・status 体系不変（NF-7 / AC-6 の判定基準） |
| MVP 認証方針 | `docs/00-getting-started-manual/specs/13-mvp-auth.md` | session 未解決→401→redirect（PG-1 の正本） |

- `_shared-context.md` §1（F-1〜F-9）・§2（S1〜S3）・§6（AC-1〜10）・§8（inventory・命名規則）
- `outputs/phase-1/phase-1.md`（確定事実・命名規則 1.4）/ `outputs/phase-2/phase-2.md`（T01〜T04 設計・ログ schema）
- `apps/api/src/middleware/error-handler.ts`（`notFoundHandler` / `UBM-1404`）
- `apps/web/src/lib/server-fetch/safe-fetch.ts`（`logServerFetchFailure` / `server_fetch_failed`）
- `apps/web/src/lib/fetch/transport.ts`（多段 fallback chain・method 制約）
- `.github/workflows/web-cd.yml`（api-cd.yml の正本テンプレ・prereq skip / smoke gate / redaction grep 同型）
- `scripts/diagnose-profile-session.sh` / `scripts/smoke/mint-staging-session-cookie.mts` / `scripts/smoke/runtime-admin-web.sh`

## 成果物

- `outputs/phase-6/phase-6.md`（本ファイル）

## 完了条件

- [x] 404/401/410 分岐の網羅（NF / SF-1〜SF-3 / PG-1〜PG-4）がケース化されている
- [x] notFound ログ payload の `hasSessionCookie` true/false 両系（NF-1 / NF-2）が固定されている
- [x] safe-fetch route-404 の `routeNotFound` true/false 両系（SF-1〜SF-3）が固定されている
- [x] transport fallback の method 制約（GET/HEAD のみ fallback・非冪等は fallback せず＝MT-1/MT-2/MT-3）が固定されている
- [x] api-cd.yml prereq skip（secret 欠落時 skip＝CD-3）と probe-1/probe-2 の成功/失敗系（CD-4/CD-5）が固定されている
- [x] diagnose script の route 存在差分（healthz=200 & /me=404＝DG-2 / /me=401＝DG-3）が固定されている
- [x] fail path と回帰 guard（6.8）・PII 非出力の負方向検証（NF-6 / SF-1 / DG-4）が列挙されている
- [x] 新規 test は `*.spec.ts` のみ（`*.test.*` 禁止）で実行補助コマンドが固定されている
