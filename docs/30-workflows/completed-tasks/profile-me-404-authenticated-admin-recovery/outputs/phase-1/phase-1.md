# Phase 1: 要件定義

## メタ情報
- workflow: profile-me-404-authenticated-admin-recovery
- SSOT: `_shared-context.md`
- 実装区分: 実装仕様書（`[実装区分: 実装仕様書]`）
- implementation_mode: `edit`（既存 error-handler/safe-fetch/診断スクリプト編集 + api-cd.yml 新規）
- taskType: implementation / NON_VISUAL（4 タスクとも UI 描画を変えない）
- visualEvidence: VISUAL_ON_EXECUTION（現象 screenshot はユーザー提供済。復旧後 screenshot は user-gated）

## 目的
staging `/profile` で認証済み管理者に `MEMBER_SESSION_404` が出る障害について、**確定事実・サブ原因仮説・受入条件・変更 inventory を固定**し、後続 Phase が「何をどのファイルにどう書くか」で迷わない状態にする。

### 実装区分の判定根拠（CONST_004 準拠）
ユーザー要求は「なぜ起きるか調査し、タスク仕様書の内容をもとにタスクを作成」＝ staging 障害の**復旧**。復旧には (a) API notFound の構造化診断ログ追加、(b) apps/api 自動 CD 追加、(c) web 側 transport 診断ログ追加、(d) 診断スクリプト拡張という**コード変更**が不可欠で、ドキュメントのみでは目的を達成できない。よってデフォルト通り実装仕様書として作成する。

## 実行タスク

### 1.1 観測事象（ユーザー提供エビデンス）
- 画面: `https://ubm-hyogo-web-staging.daishimanju.workers.dev/profile` が `200 OK` で HTML を返すが、本文に「セッション情報を取得できませんでした / アカウント情報を確認できませんでした。再ログインしてください。」＋ CTA「再ログイン」を SSR 描画（2026-06-13 10:38 / 01:24:33 GMT JST）。
- サイドバーには「万壽本大嗣 管理者」と管理メニューが正常表示（= NextAuth セッション自体は生存）。
- 認証 cookie: `__Secure-authjs.session-token`（Auth.js v5 HS256 JWT）。デコード payload: `memberId=ce86abba-ba3c-48f4-85b9-9fa09fa1b9ec` / `isAdmin=true` / `email=manjumoto.daishi@senpai-lab.com` / `name=万壽本大嗣` / `iat=1781313865` / `exp=1781400265`。`iat` はリクエスト約 8 秒前 = **新規ログイン直後**（`referer=accounts.google.co.jp`）。
- CSP `connect-src` に `https://ubm-hyogo-api-staging.daishimanju.workers.dev` を許可済。

> JWT 生文字列・secret 値は本ドキュメントに記載しない（AC-9）。上記は診断目的の確定事実のみ。

### 1.2 確定事実（F-1〜F-9）と残サブ原因（S1〜S3）
確定事実 F-1〜F-9・サブ原因 S1〜S3・横断欠陥 D-A/D-B は **SSOT `_shared-context.md` §1〜§2 を正本**とする。要点:
- **F-2/F-3**: `MEMBER_SESSION_404` は `GET /me` が HTTP 404 のときのみ生成。401 は `/login` redirect（観測されず）→ **404 で確定**。
- **F-5**: ログイン成功 → 当該 email の `member_identities`（member_id=ce86abba）+ consented `member_status` が staging D1 に存在することが逆算で確定。
- **F-6/F-7**: api `/me` ルートは有効認証下で 200/401/410/500 のみ。観測 404 は **API notFoundHandler（UBM-1404 route 未マッチ）または web↔api インフラ層**由来。
- **F-8/D-A**: apps/api に自動 CD 不在 → api-staging の version/route ドリフトが構造的素因（S1 最有力）。

### 1.3 受入条件（AC-1〜AC-10）
SSOT `_shared-context.md` §6 を正本とする（AC-1: 認証 `/me` 200 / AC-2: notFound 構造化ログ / AC-3: api 自動 CD + smoke gate / AC-4: web route-404 ログ / AC-5: 診断スクリプト route+parity / AC-6: `/me` 契約・UI 不変 / AC-7: env アクセサ・fail-closed / AC-8: spec suffix・全 green / AC-9: secret 非転記 / AC-10: commit/PR/deploy user-gated）。

### 1.4 既存コードの命名規則（FB-01/FB-SDK-07-4 準拠）
- web fetch helper: `fetchAuthed`（camelCase）、error: `FetchAuthedError` / `AuthRequiredError` / `ApiTransportError`（PascalCase + Error suffix）。
- web 構造化ログ: `console.error("server_fetch_failed", {...})` / `console.warn("api_transport_fallback", {...})` / `console.warn("auth_env_field_dropped", {...})`（snake_case イベント名）。
- api ログ: `logError({ code, status, message, ... })`（`apps/api/src/lib/logger`）、error code は `UBM-NNNN`（`UBM-1404` / `UBM-5000`）。
- workflow file: `api-cd.yml`（既存 `web-cd.yml` / `og-cd.yml` と一貫）。job 名は `deploy-staging` / `deploy-production` / `staging-runtime-smoke`（web-cd.yml 踏襲）。
- 新規 test: `*.spec.ts`（`*.test.ts` 禁止）。

### 1.5 対象 inventory（変更種別付き）
SSOT `_shared-context.md` §8 を正本とする。要約:
- 編集: `apps/api/src/middleware/error-handler.ts`（T01）/ `apps/web/src/lib/server-fetch/safe-fetch.ts`（T03）/ `apps/web/src/lib/fetch/authed.ts`（T03・必要時）/ `scripts/diagnose-profile-session.sh`（T04）。
- 新規: `.github/workflows/api-cd.yml`（T02）/ `scripts/smoke/runtime-admin-api.sh`（T02・または既存 smoke の api probe 拡張）/ `apps/api/src/middleware/error-handler.spec.ts`（T01・無ければ新規）。
- 確認のみ: `apps/api/wrangler.toml`（deploy 対象 env 整合・最小変更）。

### 1.6 P50 前提確認チェック
| 確認項目 | 判定 | 対応 |
|----------|------|------|
| current branch に実装が存在する | No | 通常実装 Phase（RED/GREEN）とする |
| upstream（dev/main）にマージ済み | No（本 WF は新規） | 未マージとして扱う |
| 前提タスク（#1237 transport fallback）完了済み | Yes | #1237 は dev マージ済。本 WF はその上に積む（transport は復旧済・404 は別レイヤ） |

### 1.7 既存関連ワークフローとの関係
- `completed-tasks/profile-session-staging-transport-recovery`（#1237）: transport throw（`MEMBER_SESSION_FAILED`）を根治。本 WF はその後に顕在化した **HTTP 404（route 層）** を扱う（別故障モード）。
- Issue #1234（FU-001 environmentExplicit）/ #1192（admin `/profile` UX）: data-cause が 401/410（S3）と確定した場合の委譲先。

## 完了条件
- [x] 確定事実 F-1〜F-9・サブ原因 S1〜S3・横断欠陥 D-A/D-B が SSOT に固定されている。
- [x] AC-1〜AC-10 が SSOT §6 に定義されている。
- [x] 変更 inventory（種別付き）が SSOT §8 に固定されている。
- [x] 実装区分が `実装仕様書` で判定根拠が明記されている。

## 成果物
- 本ファイル `outputs/phase-1/phase-1.md`
- SSOT `_shared-context.md`（§1〜§10）

## 参照資料
- `_shared-context.md`（SSOT）
- `apps/web/app/(member)/profile/_lib/session-error-display.ts`（MEMBER_SESSION_404 文言）
- `apps/web/app/(member)/profile/page.tsx`（/me → /me/profile 取得フロー）
- `apps/web/src/lib/fetch/authed.ts` / `transport.ts` / `server-fetch/safe-fetch.ts`
- `apps/api/src/middleware/session-guard.ts` / `error-handler.ts` / `me-session-resolver.ts`
- `apps/api/src/routes/me/index.ts` / `apps/api/src/routes/auth/session-resolve.ts`
- `.github/workflows/web-cd.yml`（api-cd.yml の正本テンプレ）

### システム仕様（aiworkflow-requirements）
- `docs/00-getting-started-manual/specs/02-auth.md`（session-resolve 契約）
- `docs/00-getting-started-manual/specs/13-mvp-auth.md`（MVP ログイン条件）
- `docs/00-getting-started-manual/google-form/`（responseEmail = system field・突合キー）

## 統合テスト連携
- T01: `error-handler.spec.ts` で notFound 時の構造化ログ payload（code=UBM-1404, method, path）を assert。
- T03: `safe-fetch.spec.ts` で 404 応答時に `server_fetch_failed { code: "MEMBER_SESSION_404", status: 404, transportKind, baseHost }` が出ることを assert。
- T02: `api-cd.yml` の `bash -n` 相当（actionlint / yaml 構文）と prereq skip 分岐の検証。
- 既存 `apps/web/app/(member)/profile/page.spec.tsx` の 404 分岐（再ログイン CTA）が回帰しないこと。
