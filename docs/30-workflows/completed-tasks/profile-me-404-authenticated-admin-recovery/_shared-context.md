# _shared-context.md — SSOT

`[実装区分: 実装仕様書]`

> 本ファイルは本ワークフローの **唯一の正本（SSOT）**。全 Phase / 全 SubAgent は本ファイルの確定事実・契約・AC・タスク分解を逐語で参照する。衝突時の正本順位は `index.md` を参照。

---

## 0. 一行サマリ（真の論点）

staging `/profile` で **認証済み管理者（valid JWT・ログイン直後）** に対し、サーバーコンポーネントの `GET /me` 取得が **HTTP 404（`MEMBER_SESSION_404`）** となりマイページ本体が描画されない。`/me` アプリルートは有効認証下で 404 を返さない（200/401/410/500 のみ）ため、観測 404 は **API の notFoundHandler（route 未マッチ）または web↔api 間のデプロイ／経路ドリフト**に起因する。本 WF は **今回 1 サイクルのコード変更で (1) 故障の data-cause を staging ログだけで一意に特定できる観測性を入れ、(2) api 自動 CD 欠如という構造的ドリフト源を根治し、(3) deploy 後に認証 `/me` 200 を検証する gate を設ける**ことで復旧と再発防止を同時に達成する。

> 実装区分の根拠（CONST_004）: ユーザー要求は「なぜ起きるか調査しタスク化（=復旧）」であり、観測性追加・CI/CD 追加・web 側 transport 診断強化という**コード変更なしでは達成不可能**。よってデフォルト通り実装仕様書として作成する。

---

## 1. 確定事実（コード根拠付き・F-1〜F-9）

| ID | 確定事実 | 根拠 |
|----|----------|------|
| F-1 | 画面表示は `MEMBER_SESSION_404`（title「セッション情報を取得できませんでした」/ detail「アカウント情報を確認できませんでした。再ログインしてください。」/ CTA「再ログイン」）。ユーザー提供スクショ（2026-06-13 10:38 JST）と完全一致。 | `apps/web/app/(member)/profile/_lib/session-error-display.ts:24-31`（`MEMBER_SESSION_404` 分岐） |
| F-2 | このコードは `GET /me` の HTTP 応答 status が `404` のときにのみ生成される（`fetchAuthed` が非 2xx・非 401 で `FetchAuthedError(res.status)` を throw → `safeServerFetch` の `normalizeError` が `MEMBER_SESSION_${status}` 化）。 | `apps/web/src/lib/fetch/authed.ts:56-62`, `apps/web/src/lib/server-fetch/safe-fetch.ts:15-67` |
| F-3 | 401 は `AuthRequiredError` として `rethrowOn` で再throw → page が `/login?redirect=/profile` へ **redirect** する。redirect されず error 画面が出た事実 = **401 ではなく 404** で確定。 | `apps/web/app/(member)/profile/page.tsx:42-56`, `authed.ts:56-58` |
| F-4 | 認証済みユーザーの JWT は有効。デコード結果: `{ sub/memberId: "ce86abba-ba3c-48f4-85b9-9fa09fa1b9ec", isAdmin: true, email: "manjumoto.daishi@senpai-lab.com", name: "万壽本大嗣", iat: 1781313865, exp: 1781400265 }`。`iat` は当該リクエスト（`date: Sat, 13 Jun 2026 01:24:33 GMT`）の **約 8 秒前** = **新規 Google ログイン直後**（`referer: accounts.google.co.jp`）。 | ユーザー提供 request cookie `__Secure-authjs.session-token` のデコード |
| F-5 | JWT 発行（ログイン成功）には `fetchSessionResolve(email)` が `memberId` 非 null を返す必要がある（`signIn` callback が `!resolved.memberId` で `/login?gate=...` reject）。→ staging D1 に当該 email の `member_identities`（member_id=ce86abba）と `member_status`（`rules_consent=consented`, `is_deleted=0`）が**存在することがログイン成功から逆算で確定**。 | `apps/web/src/lib/auth.ts:225-239`, `apps/api/src/routes/auth/session-resolve.ts:48-78` |
| F-6 | api `/me` ルートは有効認証下で **404 を返さない**。`sessionGuard` は session 未解決/identity・status 欠落で **401**、`is_deleted=1` で **410**、それ以外は `next()`。`GET /` handler は常に 200（zod parse 失敗時のみ onError→500）。provider middleware（`attendanceProviderMiddleware` / `writeTagNoteProviderMiddleware`）も 404 を返さない。 | `apps/api/src/middleware/session-guard.ts:76-120`, `apps/api/src/routes/me/index.ts:131-146`, `apps/api/src/middleware/repository-providers.ts` |
| F-7 | API は route 未マッチ時に `notFoundHandler` が `ApiError(code:"UBM-1404")` を **status 404** で返す。→ 観測 404 の発生源候補は **「api worker が GET /me を route できていない（notFound）」または web↔api 間インフラ層**。 | `apps/api/src/middleware/error-handler.ts:86-94`, `apps/api/src/index.ts:194`（`app.notFound(notFoundHandler)`） |
| F-8 | apps/api には **自動 CD ワークフローが存在しない**。`.github/workflows/web-cd.yml` は `bash scripts/cf.sh deploy --config apps/web/wrangler.toml`（apps/web のみ）を dev→staging / main→production で実行。apps/api を deploy する workflow は皆無（grep ヒットは verify/drift/audit のみ）。→ **api-staging worker は手動 deploy 依存で web に対し version/route ドリフトし得る構造**。 | `.github/workflows/web-cd.yml:50-61,194-201`, `ls .github/workflows`（`og-cd.yml` / `web-cd.yml` のみが CD） |
| F-9 | web→api transport は #1237 で多段フォールバック chain 化済（service-binding → INTERNAL_API_BASE_URL → NEXT_PUBLIC_API_BASE_URL）。fallback は `ApiTransportError`（fetch throw）かつ GET/HEAD 時のみで、**HTTP エラー応答（404 含む）では fallback しない**。→ いずれかの transport が 404 Response を返すと即 `MEMBER_SESSION_404` に確定。 | `apps/web/src/lib/fetch/transport.ts:58-149` |

---

## 2. サブ原因（S1〜S3）と確定責務

観測 404 の発生源は staging ランタイムログでのみ最終確定できる。コード解析で残るサブ原因は以下 3 つ。本 WF は **S1/S2 のいずれであっても復旧する根治（api CD）+ 一意特定の観測性**を today's fix とし、最終確定は Phase 11（user-gated）で行う。

| ID | サブ原因 | 確度 | 説明 | 観測で確定する signal |
|----|----------|------|------|----------------------|
| S1 | **api-staging deploy/route ドリフト** | 最有力 | api-staging worker が現行 `/me` ルート契約を持たない（手動 deploy 漏れ・古い version）。F-8 の CD 欠如が構造的素因。 | API notFound ログに `UBM-1404 GET /me` が出る / `/me/healthz` は 200 だが `/me` が 404 |
| S2 | **service-binding 経路の path/version 不整合** | 中 | OpenNext Workers の service-binding 経由で api-staging の想定外 version へ届く、または path 整形差。 | web `server_fetch_failed {code:MEMBER_SESSION_404, transportKind:"service-binding"}` |
| S3 | **当該管理者固有の member データ事象（実体は 401/410 系）** | 低 | F-3/F-6 により 404 とは整合しない（401 なら redirect）。万一 data-cause が 401/410 と判明した場合は本 WF 対象外とし、admin `/profile` UX（#1192）・FU-001（#1234）へ委譲。 | data-cause が `session-401` / `session-410` だった場合 |

> S3 が真因と判明した場合のみ本 WF はスコープ外（`index.md`「既知のスコープ外」）。S1/S2 はいずれも本 WF の T01〜T04 で復旧。

---

## 3. 因果ループ（システム観点）

- **バランスループ B1（復旧）**: 認証済み `/me` 200 ← api-staging が現行ルートを持つ ← api 自動 CD が dev/main push で deploy ← T02。
- **強化ループ R1（ドリフト悪化・現状）**: web のみ自動 deploy → web は最新・api は手動依存で古いまま → web↔api 契約乖離拡大 → `/me` 404 等の境界障害頻発。T02 が R1 を断つ。
- **観測ループ B2（診断）**: 障害再発 → notFound 構造化ログ + diagnose script で data-cause 即特定 → 原因に応じた最小修正 ← T01/T04。

---

## 4. 状態所有権（責務境界）

| レイヤ | 所有する状態 | 本 WF での扱い |
|--------|-------------|---------------|
| `apps/web` Server Component (`/profile`) | 表示分岐（session-error-display）・redirect 判断 | **文言・分岐・path・shape 不変**（T03 は診断ログのみ追加） |
| `apps/web` transport (`fetch/`) | transport chain 選択・fallback・error descriptor | T03 で route-404 を `server_fetch_failed` に明示記録（挙動不変） |
| `apps/api` `/me` route + middleware | 認証・member 解決・status 体系 | **path/shape/status 体系不変**（AC-7） |
| `apps/api` notFoundHandler | route 未マッチ応答 | T01 で構造化診断ログ追加（応答 body・status 不変） |
| `.github/workflows` + `scripts/cf.sh` | deploy パイプライン | T02 で apps/api CD 新設（web-cd.yml と同型） |
| `scripts/diagnose-profile-session.sh` | 診断 probe | T04 で route 存在 + deploy parity 拡張（read-only・冪等） |

---

## 5. タスク分解（今回サイクルで完結 / CONST_007）

| タスク | 領域 | 種別 | 並列性 | 概要 | 主変更ファイル |
|--------|------|------|--------|------|---------------|
| **T01** | `apps/api` | NON_VISUAL | 直列（最初・観測の土台） | `notFoundHandler` に構造化診断ログ（受信 `method`+`path`+ transport hint header）を追加し、`/me` 404 の data-cause を一意化。応答 body/status は不変。 | `apps/api/src/middleware/error-handler.ts`, `*.spec.ts` |
| **T02** | `.github/workflows` + `scripts` | NON_VISUAL | T01 後・T03 と並列 | apps/api 自動 CD（dev→staging / main→production）を `web-cd.yml` と同型で新設。deploy 後に `/me/healthz` 200 + minted-cookie 認証 `/me` 200 を検証する runtime smoke gate を組み込む（既存 `scripts/smoke/mint-staging-session-cookie.mts` / `runtime-admin-web.sh` 資産流用）。**S1 根治**。 | `.github/workflows/api-cd.yml`(新規), `scripts/smoke/*`（流用） |
| **T03** | `apps/web` | NON_VISUAL | T01 後・T02 と並列 | `fetchAuthed`/`safe-fetch` で route-not-found（404）を transport descriptor 付き `server_fetch_failed` に明示記録（既存ログと整合）。UI 文言・分岐・path・shape は不変（AC-7）。 | `apps/web/src/lib/server-fetch/safe-fetch.ts`（ログ強化）, `apps/web/src/lib/fetch/authed.ts`, `*.spec.ts` |
| **T04** | `scripts` | NON_VISUAL | 独立並列 | `diagnose-profile-session.sh` を拡張し、(a) `/me/healthz` vs `/me` の route 存在差分、(b) web↔api の deploy version parity を出力。read-only・冪等・secret 非出力。 | `scripts/diagnose-profile-session.sh` |

> 分割理由は「関心ごとの分離・並列実行」であり先送りではない（CONST_007）。全 T01〜T04 は後続実装プロンプト 1 サイクルで完了するスコープ。

---

## 6. 受入条件（AC-1〜AC-10）

| AC | 内容 | 検証 |
|----|------|------|
| AC-1 | 認証済み（valid JWT・identity+consented status あり）の `GET /me` が staging で **200** を返し、`/profile` 本体が描画される。 | Phase 11 staging 検証（user-gated）/ minted-cookie 認証 smoke |
| AC-2 | `/me` 404 発生時、API ログに `UBM-1404` + 受信 `method`+`path` が構造化出力され、data-cause（route 未マッチ / 認証 / data）を**ログのみで切り分け可能**。 | T01 unit test + Phase 11 ログ確認 |
| AC-3 | apps/api が dev push で staging、main push で production へ**自動 deploy** され、deploy 後に `/me/healthz` 200 と認証 `/me` 200 の smoke gate が通る。 | T02 workflow 構文検証 + Phase 11 |
| AC-4 | web 側 `server_fetch_failed` ログが route-404 を transport descriptor 付きで記録（既存 transport ログ schema と整合）。 | T03 unit test |
| AC-5 | `diagnose-profile-session.sh` が `/me` route 存在 + deploy parity を出力し、secret/cookie/memberId を**一切出力しない**。 | T04 `bash -n` + redaction grep |
| AC-6 | D1 schema・Google Form 仕様・`/me` の path/shape/status 体系・`/profile` UI 文言/分岐を**変更しない**。 | grep gate（apps/api `/me` route 差分なし / session-error-display 差分なし） |
| AC-7 | env 参照はアクセサ経由のみ（`process.env` 直接参照禁止）。認証境界 fail-closed 維持。`wrangler` 直叩き禁止（`scripts/cf.sh` 経由）。 | lint + grep |
| AC-8 | 新規 test ファイルは `*.spec.{ts,tsx}` のみ。`typecheck` / `lint` / focused test 全 green。 | CI gate |
| AC-9 | secret/cookie/JWT/memberId をコード・ログ・ドキュメントに**転記しない**（本 SSOT の JWT デコードは診断目的の確定事実記録に限る／実 secret 値は非記載）。 | redaction grep |
| AC-10 | commit / PR / push / deploy はユーザー明示指示まで実行しない（CONST_002）。 | 運用 |

---

## 7. 不変条件（CLAUDE.md / プロジェクト準拠）

1. D1 直接アクセスは `apps/api` に閉じる（不変条件 #5）。`apps/web` は `fetchAuthed` 経由のみ。
2. `/me` の path・shape・status 体系、`apps/api` 既存 endpoint surface、D1 schema、Google Form 仕様を変更しない（既存 API のみ接続）。
3. env 参照は `apps/web/src/lib/env.ts` のアクセサ経由のみ。`127.0.0.1`/`localhost` 焼き込み禁止（`verify-no-localhost-bake`）。
4. 新規 test は `*.spec.{ts,tsx}`。`wrangler` 直叩き禁止。Cloudflare 操作は `bash scripts/cf.sh`。
5. secret は Cloudflare Secrets / GitHub Secrets。平文 `.env` をコミットしない。
6. commit/PR/push/deploy/seed は user-gated（CONST_002）。

---

## 8. 想定 inventory（変更対象ファイル）

| ファイル | 変更種別 | タスク |
|----------|----------|--------|
| `apps/api/src/middleware/error-handler.ts` | 編集（notFound 構造化ログ追加） | T01 |
| `apps/api/src/middleware/error-handler.spec.ts`（または新規 `*.spec.ts`） | 新規/編集 | T01 |
| `.github/workflows/api-cd.yml` | 新規 | T02 |
| `apps/api/wrangler.toml` | 確認（deploy 対象 env 整合・変更最小） | T02 |
| `scripts/smoke/runtime-admin-api.sh`（または既存 smoke の api probe 拡張） | 新規/編集 | T02 |
| `apps/web/src/lib/server-fetch/safe-fetch.ts` | 編集（route-404 ログ） | T03 |
| `apps/web/src/lib/server-fetch/safe-fetch.spec.ts` | 編集 | T03 |
| `scripts/diagnose-profile-session.sh` | 編集（route 存在 + parity） | T04 |

> 実装着手時に既存テストファイル名・実パス（`apps/web/app/` であって `src/app/` ではない 等）を Codex/grep で再確認すること（命名ドリフト防止）。

---

## 9. ユーザー観測データ（確定事実の一次ソース・secret 非記載）

- web 応答: `GET https://ubm-hyogo-web-staging.daishimanju.workers.dev/profile` → `200 OK`（HTML 内に `MEMBER_SESSION_404` の SectionError を SSR 描画）。
- 認証 cookie: `__Secure-authjs.session-token`（Auth.js v5・HS256）。デコード payload は F-4 参照（**JWT 生文字列・secret は本ドキュメントに記載しない**）。
- CSP `connect-src` に `https://ubm-hyogo-api-staging.daishimanju.workers.dev` を許可済（api host は staging api worker）。
- `apps/web/wrangler.toml [env.staging]`: `INTERNAL_API_BASE_URL` / `NEXT_PUBLIC_API_BASE_URL` = `https://ubm-hyogo-api-staging.daishimanju.workers.dev`、service binding `API_SERVICE` → `ubm-hyogo-api-staging`。

---

## 10. 正本テンプレート

本 WF の Phase ファイル様式は先行 `docs/30-workflows/completed-tasks/profile-session-staging-transport-recovery/`（同一ドメイン・recovery spec）に準拠する。Phase 11 は復旧検証（user-gated）に特化し、screenshot は `implemented_local_runtime_pending` のため `pending`。
