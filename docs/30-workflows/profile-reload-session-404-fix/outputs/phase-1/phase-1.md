# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 |
| taskType | implementation |
| implementation_mode | new |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |

## 目的

会員マイページ `/profile` リロード時に発生する `GET /me` の 404 起因エラーバナーについて、観測事象・真因・受入条件（AC）・対象 inventory を確定し、後続フェーズが実装可能な粒度の前提を固定する。

## 実行タスク

### 1.1 不具合の事実関係（観測事象）

| 項目 | 値 |
|------|------|
| 環境 | staging（`ubm-hyogo-web-staging.daishimanju.workers.dev`） |
| 画面 | 会員マイページ `/(member)/profile`（サイドバー「マイページ」active） |
| 操作 | ブラウザリロード（フル SSR） |
| 表示 | エラーバナー「セッション情報を取得できませんでした」/ detail「fetchAuthed failed: 404」/ リンク「再読み込み」 |
| ログイン状態 | `MD 管理者`（admin かつ member）でログイン済み |

ブラウザコンソールの以下は**本件と無関係**（スコープ外）:
- `Permissions-Policy header: Unrecognized feature: 'browsing-topics'`（Chromium 標準警告）
- `content.js POST http://127.0.0.1:8888/ net::ERR_CONNECTION_REFUSED`（ブラウザ拡張）
- `[Sentry] You cannot use Sentry.init() in a browser extension`（ブラウザ拡張バンドル）

### 1.2 真因の確定（Why）

| 階層 | 内容 | 根拠 |
|------|------|------|
| 観測 | `/profile` の Server Component が `fetchAuthed<MeSessionResponse>("/me")` で 404 を受信し `SectionError` を描画 | `apps/web/app/(member)/profile/page.tsx:41-62` |
| エラー識別 | `FetchAuthedError` の message が `fetchAuthed failed: 404`（status=404）。401 ではないため `AuthRequiredError` rethrow（→ `/login` redirect）には乗らず、`!meResult.ok` 分岐に落ちる | `apps/web/src/lib/fetch/errors.ts:12` / `apps/web/src/lib/fetch/authed.ts:53-59` |
| 直接原因 | API Worker `GET /me` が 404 を返している。`/me` の正常系には 404 分岐が存在しない（`sessionGuard` は session 未解決→401・identity/status 不在→401・is_deleted→410 のみ、`GET /` ハンドラは 200） | `apps/api/src/middleware/session-guard.ts:76-120` / `apps/api/src/routes/me/index.ts:131-147` |
| 一段上 | よって 404 は `app.notFound(notFoundHandler)`（ルート不一致）に由来する | `apps/api/src/index.ts:193` |
| 根本（ルート解決層） | Hono 4.12.18 で `app.route("/me", sub)` + `sub.get("/")` は **`GET /me`→200 / `GET /me/`(末尾スラッシュ)→404** になる。末尾スラッシュ付き要求や、フルアプリ・マウント経路の回帰がそのまま 404 として露出する。`createMeRoute` の contract テストは `app.request("/")` でサブアプリに直接当てており**マウント経路を検証していない** | 実証: `node` で Hono mount を再現し `/me/`→404 / `/me`→200 を確認 / `apps/api/src/routes/me/index.contract.spec.ts:74,82,99` |
| 派生欠陥 | web プロキシ `apps/web/app/api/me/[...path]/route.ts:42` は `${api}/me/${path.join("/")}` を生成。path が空のとき `${api}/me/`（末尾スラッシュ）→ 404 を引き起こす | `apps/web/app/api/me/[...path]/route.ts:42` |

> 補足: `apps/web/src/lib/auth.ts:222-223` の signIn callback は `memberId` を必須化しており、ログイン済みユーザーは必ず member（admin-only でセッション発行されない）。したがって本事象は「admin だから 404」ではなく、ルート解決層の問題である。

### 1.3 受入条件（AC）

| ID | 受入条件 |
|----|----------|
| AC-1 | `apps/web` の `/profile` で `GET /me` が 404（コード `MEMBER_SESSION_404`）を返したとき、生の「fetchAuthed failed: 404」を表示せず、再ログイン導線（`/login?redirect=/profile` への CTA）つきの明示エラー（例:「アカウント情報を確認できませんでした。再ログインしてください。」）を表示する |
| AC-2 | `/me` が 404 以外の非 2xx（5xx 等）を返したときは、技術文字列を露出しない一般向け文言（例:「セッション情報を取得できませんでした。時間をおいて再読み込みしてください。」）+「再読み込み」リンクを表示する（既存挙動の文言改善） |
| AC-3 | `/me` が 401 のとき（`AuthRequiredError`）は従来どおり `/login?redirect=/profile` へ redirect する（回帰なし） |
| AC-4 | API Worker が `GET /me/`（末尾スラッシュ）を受け取ったとき、404 ではなく `GET /me` と同じ解決結果（未認証なら 401、正規セッションなら 200）に到達する |
| AC-5 | フルアプリ（`apps/api/src/index.ts` の `app`）をマウント経由で叩く統合テストが存在し、`GET /me`（認証なし）が **404 ではなく 401** を返すこと、`GET /me/` も同様に 404 にならないことを保証する |
| AC-6 | web プロキシ `/api/me/[...path]` が空 path（`/api/me`）でも upstream に末尾スラッシュ無し `/me` を送る（`/me/` を生成しない）。既存の `/api/me/visibility-request` 等は従来どおり `/me/visibility-request` を送る（回帰なし） |
| AC-7 | `/me` のレスポンス shape・path（`/me`, `/me/profile`, `/me/attendance`, `/me/visibility-request`, `/me/delete-request`, `/me/photo`）と D1 schema・Google Form 仕様は一切変更しない |
| AC-8 | `mise exec -- pnpm typecheck` / `pnpm lint` / 対象 vitest がすべて PASS |

### 1.4 既存コードの命名規則（FB-01 / FB-SDK-07-4 対応）

| 観点 | 既存規則 | 本タスクでの遵守 |
|------|----------|------------------|
| web fetch helper | `fetchAuthed` / `safeServerFetch`（`codePrefix`_`<status>` で error code 生成、例 `MEMBER_SESSION_404`） | error code 分岐は `MEMBER_SESSION_404` 文字列で判定 |
| web エラー表示 | `SectionError`（`title` / `detail` / `retryHref` props・`section-error` primitive） | CTA 追加は `actionHref` / `actionLabel` の optional props 拡張に留める（新規コンポーネント・新規 primitive を作らない） |
| API ルート | Hono `app.route("/<base>", subApp)` + `subApp.get("/...")` | 末尾スラッシュ正規化は全 route 共通の middleware として追加（`/me` 専用ハードコードを増やさない） |
| API テスト | `*.contract.spec.ts` / `*.spec.ts`（`describe`/`it`、`app.request(path, init, env)`） | 統合テストは `*.integration.spec.ts` を `*.spec.ts` 規則内で追加 |

### 1.5 対象 inventory（current code anchor）

| 系統 | パス | 役割 |
|------|------|------|
| route owner (api) | `apps/api/src/index.ts` | 全 route mount + `notFound` |
| me route (api) | `apps/api/src/routes/me/index.ts` | `GET /me` ほか |
| session guard (api) | `apps/api/src/middleware/session-guard.ts` | 401/410 判定（404 は返さない） |
| me contract test (api) | `apps/api/src/routes/me/index.contract.spec.ts` | サブアプリ直叩き（マウント未検証） |
| web fetch helper | `apps/web/src/lib/fetch/authed.ts` / `errors.ts` / `apps/web/src/lib/server-fetch/safe-fetch.ts` | 401→`AuthRequiredError` / 非2xx→`FetchAuthedError` / error code 正規化 |
| profile page (web) | `apps/web/app/(member)/profile/page.tsx` | `GET /me` 結果分岐 + エラーバナー |
| error UI (web) | `apps/web/src/components/member/SectionError.tsx` | エラーバナー primitive |
| me proxy (web) | `apps/web/app/api/me/[...path]/route.ts` | client → upstream `/me/*` プロキシ |

## 完了条件

- [x] 観測事象・真因（ルート解決層 404）を anchor 付きで確定
- [x] AC-1〜AC-8 を明示列挙
- [x] 既存命名規則・対象 inventory を記録
- [x] スコープ外（ブラウザ拡張ノイズ等）を分離

## 成果物

- `outputs/phase-1/phase-1.md`（本ファイル）

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | セッション / Auth.js / `/me` 解決の正本 |
| MVP 認証方針 | `docs/00-getting-started-manual/specs/13-mvp-auth.md` | authGateState / session 境界 |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | `/me` レスポンス項目 |

## 統合テスト連携

Phase 4 で I/O 契約（`/me` / `/me/` の HTTP 期待値、`/profile` の error code 分岐）を確定し、Phase 5/6 で T01〜T03 のテストへ落とし込む。
