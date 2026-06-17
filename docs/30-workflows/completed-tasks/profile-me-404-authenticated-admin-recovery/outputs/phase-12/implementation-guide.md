# Phase 12: 実装ガイド（implementation-guide）

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `profile-me-404-authenticated-admin-recovery` |
| Phase | 12 / 13 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | `implemented_local_runtime_pending` |

---

## Part 1: 中学生レベルの概念説明（なぜ → 何を）

### なぜこの修正が必要か（日常の例え話）

マイページを開くと、画面の裏側では「受付係」（web Worker）が「名簿係」（API Worker）に「この人の会員情報をください」とお願いしています。今 staging で起きているのは、**家の玄関の鍵はちゃんと通って中に入れたのに、いざ奥の部屋に行こうとすると「その部屋番号はありません」と言われてしまう**、という故障です。

たとえば、引っ越したばかりのマンションで、玄関のオートロックは新しい暗証番号で開いたのに、郵便受けの部屋番号案内が**古い地図のまま**だったとします。あなた自身は正しい住人（ログイン成功 = 鍵は通った）なのに、案内図が古いせいで「○○号室は存在しません」と表示される。これがまさに今の状態です。

確定していることは 3 つです。

- **あなたは正しい住人**: ログインに成功している以上、名簿には確かにあなたの情報があります（鍵が開いた = 会員データは存在する）。
- **「退会済み」でも「名簿が壊れている」でもない**: もしそうなら別の表示文言（再ログイン画面への移動など）になるはずなのに、出ているのは「セッション情報を取得できませんでした」という、**部屋番号が見つからないときだけ出る専用の文言**です。
- **案内図（名簿係の住所録）が古い疑いが濃厚**: 受付係（web）は新しい案内図に毎回自動で差し替えられるのに、名簿係（api）は**手作業でしか差し替えられない仕組み**になっていて、差し替え忘れると古いまま取り残されます。

### 何をするか（4 つの工事）

今回は「次に同じ故障が起きても原因がすぐ分かり、しかも案内図が自動で最新に保たれる」ようにする 4 つの工事をします。名簿係そのもの（会員情報の中身や答え方）には一切手を入れません。

1. **T01 受付ログの設置（観測性）**: 名簿係が「その部屋番号はありません」と答えたとき、**「どの入口から・どの部屋番号を・鍵を持った人が来たか」を記録**するようにします。鍵の中身（秘密の番号）は書かず、「鍵を持っていたか / 持っていなかったか」だけを丸印で記録します。これで次に故障しても記録を読むだけで原因が分かります。
2. **T02 案内図の自動差し替え（自動 CD）**: 名簿係の案内図を、受付係と同じように**自動で最新版に差し替える仕組み**を新しく作ります。差し替えた後すぐに「部屋への道は通っているか」を 2 回テスト（健康チェックと、実際に鍵を持って部屋に行けるか）して、ダメなら差し替えを失敗扱いにします。これが今回の根本原因の本命対策です。
3. **T03 受付係のメモ追記（web ログ）**: 受付係が「部屋番号が見つからなかった」失敗をしたとき、**どの入口（内線か外線か）を使ったかをメモに 1 行足す**ようにします。今までのメモの形は変えず、足すだけです。
4. **T04 点検キットの改良（診断スクリプト）**: 点検スクリプトに「健康チェック窓口は通るのに本物の部屋だけ通らない」状態を**自動で見分ける項目**と、受付係と名簿係の案内図が同じ版かを比べる項目を足します。読むだけ・何度やっても同じ結果・秘密は出さない、を守ります。

この 4 つで、原因が S1（案内図が古い）でも S2（入口の取り次ぎ違い）でも、マイページは復旧し、再発しても記録を読むだけで原因が特定できます。

---

## Part 2: 技術者向け実装ガイド

### 背景

staging `/profile`（認証済み管理者・valid JWT・Google ログイン直後）で `MEMBER_SESSION_404`（`session-error-display.ts:24-31` 分岐・title「セッション情報を取得できませんでした」/ CTA「再ログイン」）が SSR 描画され、マイページ本体が出ない（F-1）。この文言は `fetchAuthed` が `GET /me` の HTTP 応答 status 404 で `FetchAuthedError(404)` を throw し、`safe-fetch` の `normalizeError` が `MEMBER_SESSION_404` 化したときにのみ生成される（F-2）。401 なら `page.tsx` が `/login?redirect=/profile` へ redirect するため、error 画面が出た事実が 404 を確定させる（F-3）。JWT は valid・新規ログイン直後（F-4）で、ログイン成功は `fetchSessionResolve` が非 null `memberId` を返した証＝D1 に identity + consented status が存在する（F-5）。api `/me` ルートは有効認証下で 200/401/410/500 のみを返し 404 を返さない（F-6）ため、観測 404 は `notFoundHandler`（`UBM-1404` route 未マッチ）か web↔api インフラ層（F-7）。apps/api には自動 CD が存在せず（F-8）、transport chain は HTTP エラー応答で fallback しない（F-9）。

### 要約

T01（apps/api notFound 観測性・直列先行）→ {T02（apps/api 自動 CD + smoke gate）∥ T03（web route-404 ログ）} ∥ T04（diagnose route 差分 + parity）の 4 タスクで、**S1/S2 のいずれであっても復旧する多層防御 + 再発時にログだけで data-cause を一意化する観測性**を 1 サイクルで実装する。`/me` の path・shape・status 体系・`apps/api` 既存 endpoint surface・D1 schema・Google Form 仕様・`/profile` UI 文言/分岐は一切変更しない（AC-6）。data-cause の最終確定は deploy 後の Phase 11 RT-E（user-gated）。

### 実行順序（spec の正本）

```
T01（直列・最初）: apps/api notFoundHandler に構造化診断ログを追加（観測の土台）
   │   （T02 smoke gate と T03 web ログが指す data-cause を T01 ログと突合して確定するため先行必須）
   ├─→ T02（T01 後・T03 と並列可）: apps/api 自動 CD（dev→staging / main→production）+ post-deploy smoke gate
   └─→ T03（T01 後・T02 と並列可）: web safe-fetch に routeNotFound ログ追加
T04（T01〜T03 と独立並列）: diagnose-profile-session.sh に route 差分 + parity 追加
```

### T01: apps/api notFoundHandler 構造化診断ログ（`outputs/phase-5/task-01-api-notfound-observability.md`）

対象は `apps/api/src/middleware/error-handler.ts:86` の `notFoundHandler`。現状は `ApiError({ code:"UBM-1404", detail })` を生成し `errorHandler(err, c)`（同 :41）へ委譲する。`ApiError` の `context` に診断フィールドを載せ、`errorHandler` の既存伝播経路（:79 `if (apiError.log.context !== undefined) payload.context = apiError.log.context;`）でログへ届ける。応答 body（`application/problem+json` の `UBM-1404`）・status `404`・headers は不変。

```ts
// notFoundHandler が ApiError.context に載せる構造化診断 payload の型
interface NotFoundDiagnosticContext {
  reason: "route_not_matched"; // 固定文字列定数
  method: string;              // c.req.method（"GET" 等）
  path: string;                // new URL(c.req.url).pathname（query/cookie を含まない pathname のみ）
  hasAuthorization: boolean;   // c.req.header("authorization") !== undefined の boolean 化のみ
  hasSessionCookie: boolean;   // c.req.header("cookie") が __Secure-authjs.session-token を含むかの boolean 化のみ
}
```

| フィールド | 型 | secret 非出力の根拠 |
| --- | --- | --- |
| `reason` | `"route_not_matched"` | 定数文字列。secret なし |
| `method` | `string` | `c.req.method`。secret なし |
| `path` | `string` | pathname のみ。query/cookie 非含有 |
| `hasAuthorization` | `boolean` | Authorization ヘッダの**有無の boolean 化のみ**。Bearer token 値を出さない（AC-9） |
| `hasSessionCookie` | `boolean` | session cookie の**有無の boolean 化のみ**。cookie 値・JWT 生文字列を出さない（AC-9） |

二重防御: `@ubm-hyogo/shared/logging` の `logError` は `SENSITIVE_KEY_SUBSTRINGS`（`authorization` / `cookie` / `token` / `secret` 等）を含む context キーを `[REDACTED]` 化する。T01 は boolean フィールド名に `authorization`/`cookie` を含めない（`hasAuthorization` / `hasSessionCookie`）ことで redaction の誤発火を避けつつ、値を boolean 化して二重に secret 非漏洩を担保する。

data-cause 切り分け（AC-2）: `UBM-1404 + path=/me + hasSessionCookie=true` = cookie は届いているが route 未マッチ（S1）→ T02 で根治。`UBM-1404 + path=/me + hasSessionCookie=false` = cookie 未到達（S2 寄り・web T03 ログと突合）。`UBM-1404` 自体が出ず 401/410 が出る = route 健全・認証/data 層（S3・スコープ外）。

### T02: apps/api 自動 CD + post-deploy smoke gate（`outputs/phase-5/task-02-apps-api-auto-cd-and-smoke-gate.md`）

新規 `.github/workflows/api-cd.yml`。正本テンプレは `.github/workflows/web-cd.yml`（`name: web-cd` / `deploy-staging` / `admin-runtime-smoke` / `deploy-production` の構造）。deploy 対象を `apps/api/wrangler.toml` に置換する。

| 項目 | 契約 |
| --- | --- |
| トリガ | `push` to `dev`（→ staging）/ `push` to `main`（→ production） |
| paths フィルタ | `apps/api/**` / `packages/shared/**` / `.github/workflows/api-cd.yml`（shared 型変更経由の挙動変化も発火・取りこぼし回避優先） |
| concurrency | `group: api-cd-${{ github.ref_name }}` / `cancel-in-progress: true` |
| permissions | `contents: read`（job-level secret 配置禁止・step-scoped のみ） |
| job: `deploy-staging` | `if: github.ref_name == 'dev'` / `environment.name: staging` |
| job: `deploy-production` | `if: github.ref_name == 'main'` / `environment.name: production` |
| job: `api-runtime-smoke` | `needs: deploy-staging` / `environment.name: staging-runtime-smoke` |
| deploy コマンド | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging`（production は `--env production`）。`wrangler` 直叩き禁止（AC-7） |
| secret 渡し | `CLOUDFLARE_API_TOKEN` を deploy step の step-scoped env のみで渡す（empty token guard 付き）。`CLOUDFLARE_ACCOUNT_ID` は `vars` |
| prereq skip 分岐 | `STAGING_AUTH_SECRET` / `STAGING_ADMIN_MEMBER_ID` / `STAGING_ADMIN_EMAIL` / `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` / 新規 `STAGING_API_BASE` のいずれか欠落で `::notice::api runtime smoke skipped; missing ...` → `skip_reason=missing:...` を `$GITHUB_OUTPUT` に書き **exit 0**（fail させない） |
| probe-1（route 生存） | `GET {STAGING_API_BASE}/me/healthz` が **HTTP 200**（`apps/api/src/index.ts:216` の `app.get("/me/healthz", ...)` が `{ok:true,scope:"me"}` を無認証で返す）。200 でなければ job fail |
| probe-2（認証 `/me` 200） | `scripts/smoke/mint-staging-session-cookie.mts` で minted admin cookie を発行し `GET {STAGING_API_BASE}/me` を cookie 付きで叩く → **HTTP 200**。401/410/404 はいずれも fail（probe-1=200 かつ probe-2=404 = 「healthz は通るが /me が route 未マッチ」を CI が捕捉 = S1 検出） |
| smoke runner | `scripts/smoke/runtime-admin-api.sh` を新設（`runtime-admin-web.sh` を雛形に probe 先を api host の `/me/healthz` + `/me` に置換）。`mint-staging-session-cookie.mts` は流用 |
| cookie マスク / redaction | minted cookie は `::add-mask::` でマスクし `$GITHUB_ENV` に格納。`if: always() && skip_reason == ''` で ci-evidence を `grep` し `__Secure-authjs.session-token=`・`authorization:`・`Bearer` ヒットで `::error::` + exit 1（AC-9） |

`apps/api/wrangler.toml` は参照のみ・変更しない。deploy 対象 env 名は staging=`ubm-hyogo-api-staging`（:145）/ production=`ubm-hyogo-api`（:49）。smoke は api 直 probe（`/me/healthz` + 認証 `/me`）で、web 経由 `/profile` smoke は web-cd の責務（重複させない）。

### T03: web safe-fetch route-404 ログ（`outputs/phase-5/task-03-web-route404-logging.md`）

対象は `apps/web/src/lib/server-fetch/safe-fetch.ts:69` の `logServerFetchFailure`。現状 `console.error("server_fetch_failed", { code, path, status, ...transport })` を出す。`error.code` が `/_404$/` に完全一致するときのみ `routeNotFound: true` を payload に追加する（他は不変）。

```ts
// server_fetch_failed ログ payload（routeNotFound 追加後）
interface ServerFetchFailedLog {
  code: string;                          // 既存・不変。normalizeError が `${codePrefix}_${status}` で生成（"MEMBER_SESSION_404" 等）
  path: string;                          // 既存・不変。opts.logPath（pathname 相当）
  status: number | null;                 // 既存・不変。code 末尾 3 桁を /_(\d{3})$/ で抽出
  transportKind?: "service-binding" | "http"; // 既存・不変。error.transport から spread（存在時のみ）
  baseHost?: string;                     // 既存・不変。host のみ・secret なし
  routeNotFound?: true;                  // T03 新規。code が /_404$/ のときのみ付与・404 以外はキー自体を出さない
}
```

`normalizeError`（:49）の `code` 生成・`transport` 正規化・`statusFromError`・`AuthRequiredError` 経路は不変。`session-error-display.ts`（`MEMBER_SESSION_404` 文言）・`page.tsx` の redirect/notFound 分岐・`/me` の path/shape は非接触（AC-6）。`routeNotFound:true + transportKind:"http"` は T01 の `UBM-1404 GET /me` と 1:1 対応（S1 確定）、`routeNotFound:true + transportKind:"service-binding"` は service-binding 経路 404（S2 寄り）。

### T04: diagnose-profile-session.sh route 差分 + parity（`outputs/phase-5/task-04-diagnose-script-route-and-parity.md`）

対象は `scripts/diagnose-profile-session.sh`。read-only・冪等・secret 非出力。現状すでに `web_api_me_status` / `api_me_status` / `profile_data_cause` / `deployments_hint` を出力する。T04 で route 存在差分と parity hint を追加する。

| 区分 | 契約 |
| --- | --- |
| 入力（env） | `PROFILE_SESSION_BASE_URL`（web 既定 staging）/ `PROFILE_SESSION_API_BASE_URL`（API direct 既定 staging）/ `PROFILE_SESSION_COOKIE` ⊻ `PROFILE_SESSION_COOKIE_FILE`（排他・任意）/ `PROFILE_SESSION_CF_ENV`（既定 `staging`） |
| 出力（新規） | `api_me_healthz_status=<3桁 or 000>`（`GET {API}/me/healthz` status）/ `api_route_diff=<healthz_alive_me_miss \| both_alive \| both_miss \| healthz_miss>`（healthz=200 かつ /me=404 → `healthz_alive_me_miss` = route 設定異常 sign / `/me=401` → 健全 `both_alive`）/ `parity_hint=<bash scripts/cf.sh 経由の web↔api version 確認手順文字列>` |
| exit code | `0`: 全 probe 完了（probe 先が 4xx/5xx/000 でも診断成功）/ `2`: cookie 二重指定等 usage 違反（既存維持）。curl 失敗は status `000` に正規化し exit 0 |
| 禁止（不変） | secret 実値・cookie 値・token・memberId を出力しない。`wrangler` 直叩きしない（version 確認は `bash scripts/cf.sh` 経由の手順文字列を出力するのみ・実行しない = read-only） |

### 検証コマンド（全体・SSOT §8）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
# focused vitest（T01: api / T03: web）
cd apps/api
mise exec -- pnpm exec vitest run --root=../.. --config=vitest.config.ts \
  apps/api/src/middleware/error-handler.spec.ts
cd ../web
mise exec -- pnpm exec vitest run --root=../.. --config=vitest.config.ts \
  'apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts'
cd ../..
bash -n scripts/smoke/runtime-admin-api.sh        # T02 smoke runner 構文
bash -n scripts/diagnose-profile-session.sh       # T04 診断スクリプト構文
git diff dev --name-only | grep '^apps/api/src/routes/me/'   # 空出力期待（/me route 非接触・AC-6）
grep -rn '127.0.0.1:8888' apps/web/src            # 空出力期待（localhost 焼き込み禁止）
# 復旧検証（user-gated・deploy 後）
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
bash scripts/diagnose-profile-session.sh
```

### エラーハンドリング

- T01: notFound 応答 body・status `404` は無加工で返し、`UBM-1404` の `application/problem+json` 体系を不変に保つ。診断 context の追加のみ。
- T02: prereq secret 欠落時は smoke を fail させず `skip_reason` を出力して exit 0（CI を不必要にブロックしない）。probe-1=200 かつ probe-2=404 は job fail で S1 を CI が捕捉する。
- T03: HTTP エラー Response（401/410/500）は `routeNotFound` を付けず、`AuthRequiredError`（401 redirect）・`MEMBER_SESSION_<status>` 体系を不変に保つ。
- T04: curl 失敗は status `000` に正規化し exit 0（read-only 診断を中断しない）。cookie 二重指定は usage 違反として exit 2（既存維持）。

### エッジケース

- `routeNotFound` は `code` が `/_404$/` に**完全一致**するときのみ付与。`*_410` / `*_500` には付与しない。
- diagnose の route 差分判定で、無認証 `/me` が健全でも **401** を返す（404 ではない）ため、`401` を route miss と誤判定しない（F-6・偽陽性回避）。
- transport fallback 対象は GET/HEAD のみ。`/me` 取得は GET だが、HTTP エラー Response（404）では fallback せず即 `MEMBER_SESSION_404` 確定（F-9）。
- smoke の minted cookie は `::add-mask::` でマスクし stdout に生値を出さない。

### 設定可能パラメータ

| パラメータ | 所在 | 既定 / 値 |
| --- | --- | --- |
| `STAGING_API_BASE`（新規 secret/var） | GitHub Environment `staging-runtime-smoke` | smoke probe 先（`https://ubm-hyogo-api-staging.daishimanju.workers.dev`）。欠落時は smoke skip（user-gated 登録） |
| deploy env 名（staging） | `apps/api/wrangler.toml` `[env.staging]` | `ubm-hyogo-api-staging`（:145・参照のみ） |
| deploy env 名（production） | `apps/api/wrangler.toml` | `ubm-hyogo-api`（:49・参照のみ） |
| `PROFILE_SESSION_API_BASE_URL` | diagnose script env | `https://ubm-hyogo-api-staging.daishimanju.workers.dev` |
| `PROFILE_SESSION_CF_ENV` | diagnose script env | `staging` |

### 既知制限

- `apps/api` の `/me` route 本体は非接触のため、data-cause が S3（401/410 系・member データ/認証境界事象）と確定した場合は本 WF のスコープ外。admin `/profile` UX = Issue #1192 / environmentExplicit fail-closed = Issue #1234（FU-001）へ委譲する（unassigned-task-detection 連動）。
- staging deploy・復旧確認・認証 `/me` 200・runtime screenshot・commit・push・PR は user-gated（local証跡は実施済み）。
- smoke gate の probe-2（認証 `/me` 200）は `STAGING_API_BASE` 等の secret 登録が前提。未登録時は smoke skip（exit 0）で CD 本体は通る。

---

## 視覚証跡

VISUAL_ON_EXECUTION。本 WF のコード変更 T01〜T04 は NON_VISUAL（API ログ / CI/CD / web transport ログ / 診断 script 層に閉じ、`session-error-display.ts` / `SectionError` / `/profile` page.tsx を非接触）で UI 描画を変えない。唯一意味のある visual 証跡は復旧後の `/profile` 正常描画だが、これは staging 認証ログインを要し user-gated。

| 証跡 | パス | 状況 |
| --- | --- | --- |
| 現象 screenshot（ユーザー提供 2026-06-13 10:38 JST・`MEMBER_SESSION_404`） | （ユーザー提供画像・文中参照・リポジトリ非配置） | user-provided（受領済み） |
| 手動テスト計画 + data-cause 確定手順（RT-A〜RT-E） | `outputs/phase-11/manual-test-result.md` | present |
| screenshots placeholder（VISUAL_ON_EXECUTION・ディレクトリ保持） | `outputs/phase-11/screenshots/.gitkeep` | present |
| 復旧後 staging runtime screenshot | `outputs/phase-11/screenshots/profile-me-404-recovery-staging.png` | pending（user-gated・認証必須・`implemented_local_runtime_pending` では未取得） |

## 完了条件

- [x] Part 1（中学生レベル・例え話「家の鍵は通ったのに奥の部屋の番号案内が古い地図のせい」・`たとえば` を含む・なぜ→何を）を記述
- [x] Part 2（実行順序 T01→{T02∥T03}∥T04 / task 別 変更ファイル・型・契約・検証コマンド / エラーハンドリング / エッジケース / 設定可能パラメータ / 既知制限）を背景・要約つきで記述
- [x] notFoundHandler の構造化ログ payload を TypeScript 型 `{ reason:"route_not_matched"; method; path; hasAuthorization; hasSessionCookie }` で明記
- [x] safe-fetch の `routeNotFound:boolean` 追加・api-cd.yml job 契約・diagnose route 差分 + parity を記述
- [x] 識別子を実コードから引用（`error-handler.ts:86` notFoundHandler / `safe-fetch.ts:69` logServerFetchFailure / `web-cd.yml` / `apps/api/src/index.ts:216` `/me/healthz`）
- [x] `## 視覚証跡` で現象 screenshot=user-provided / 復旧後=user-gated pending を明記
- [x] secret/cookie/JWT/memberId を非転記（AC-9）

## 成果物

- `outputs/phase-12/implementation-guide.md`（本ファイル）

## 参照資料

- `_shared-context.md` §1（F-1〜F-9）/ §2（S1〜S3）/ §5（T01〜T04）/ §8（inventory）
- `outputs/phase-4/phase-4.md`（I/O 契約・notFound ログ payload・api-cd job 契約・RED 観点）
- `outputs/phase-5/task-01..04-*.md`（実装仕様書本体）
- `apps/api/src/middleware/error-handler.ts:86`（notFoundHandler）/ `apps/api/src/index.ts:216`（`/me/healthz`）/ `apps/web/src/lib/server-fetch/safe-fetch.ts:69`（logServerFetchFailure）/ `.github/workflows/web-cd.yml`（api-cd テンプレ）/ `scripts/diagnose-profile-session.sh`
