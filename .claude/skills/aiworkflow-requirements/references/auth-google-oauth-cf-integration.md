---
title: UBM-Hyogo Google OAuth + Cloudflare Workers 統合パターン
scope: apps/web (Auth.js v5) ↔ apps/api (Hono) on Cloudflare Workers + OpenNext
related: architecture-auth-security-*, deployment-cloudflare-opennext-workers, interfaces-auth-core, environment-variables, lessons-learned-05a-authjs-admin-gate-2026-04
---

# 概要

UBM-Hyogo は `apps/web`（Next.js + Auth.js v5）と `apps/api`（Hono + D1）を Cloudflare Workers 上で分離運用する。Auth.js v5 を edge runtime で動かす際、`process.env` 不完全問題・workers.dev loopback 404・D1 binding 不在などの統合課題が発生する。本 reference はそれらを「将来同種課題を最短で解決するための実装ハブ」として集約する。詳細仕様や個別サブシステムは関連ファイル（`architecture-auth-security-*` / `deployment-cloudflare-opennext-workers` / `interfaces-auth-core` / `environment-variables`）を参照する。

スコープは UBM-Hyogo 固有の Google OAuth + admin gate 経路に限定する。Auth.js 一般論や Supabase / Electron 経路は対象外（旧 `architecture-auth-security-*` の Electron 系セクションは無関係）。

# 構成図（テキスト）

```
Browser
   │  (1) GET /admin/* with auth.js cookie
   ▼
apps/web (Workers + OpenNext)
   │  middleware.ts: JWT verify only (NO D1 access)
   │  ├── unauthorized → /login?gate=admin
   │  └── authorized   → forward to route handler
   │
   │  Auth.js signIn callback
   │  ▼
   │  /auth/session-resolve  ← internal-only, INTERNAL_AUTH_SECRET header
   │     (service-binding: env.API_SERVICE.fetch)
   ▼
apps/api (Workers + Hono)
   │  /auth/session-resolve handler
   │  ├── verify INTERNAL_AUTH_SECRET (fail-closed)
   │  └── D1 lookup → { memberId, isAdmin }
   ▼
JWT claims に積んで返却 → Auth.js が cookie に永続化
```

# 環境変数

詳細値・op 参照経路は `environment-variables.md` を正本とする。本 reference では「どの層が何を要求するか」のみ列挙する。

| 変数 | 設定先 | 用途 |
| --- | --- | --- |
| AUTH_SECRET | apps/web | Auth.js JWT 署名（web/api 間で共有しない） |
| AUTH_GOOGLE_ID | apps/web | Google OAuth Client ID |
| AUTH_GOOGLE_SECRET | apps/web | Google OAuth Client Secret |
| INTERNAL_AUTH_SECRET | apps/web + apps/api | service-binding 内部呼出の共有秘匿値（同一値必須） |
| PUBLIC_API_BASE_URL | apps/web | local dev fallback / browser 公開 fetch |
| INTERNAL_API_BASE_URL | apps/web | service-binding 不在時のサーバ間 fallback |

`AUTH_SECRET` は web 側のみ。`INTERNAL_AUTH_SECRET` は web/api 両方に同一値で必須。欠落時は fail-closed（unregistered 扱い）。

# 主要パターン

## 1. 二段防御 middleware

`apps/web/middleware.ts` は edge runtime で動く。ここでは Auth.js cookie の JWT verify のみ実施し、D1 アクセスは禁止する（edge には D1 binding が無く、あっても latency 上不適切）。

- 1段目: cookie 存在 + JWT signature/exp 検証 → fail なら `/login?gate=<reason>` redirect
- 2段目: route handler 側で必要なら `/auth/session-resolve` 経由の admin 判定を再確認

`gate` パラメータ（例: `gate=admin` / `gate=unregistered` / `gate=expired`）は UI 文言切替に使用する。middleware は claims から `isAdmin` を読み、admin route で false なら `/` へ redirect（unauthorized 表示は web 層で完結させる）。

詳細な claim 定義は `interfaces-auth-core.md` ではなく UBM-Hyogo の signIn callback コードを正本とする（`apps/web/src/lib/auth.ts`）。

## 2. service-binding 経由の internal API call

同一 Cloudflare アカウント配下で `workers.dev` ドメインへ public fetch すると loopback 404 が返る既知問題がある。これを避けるため `apps/web` は `apps/api` を **service binding** 経由で呼ぶ。

- 主経路: `env.API_SERVICE.fetch(request)`（Worker-to-Worker、内部 RPC）
- fallback: `PUBLIC_API_BASE_URL` への通常 fetch（local dev / preview のみ）

実装は `apps/web/src/lib/fetch/public.ts` に集約し、内部 fetch ヘルパは binding を主・PUBLIC_API_BASE_URL を従に切り替える。`wrangler.toml` 側は env ごとに binding 宣言が必要：

```toml
[[env.staging.services]]
binding = "API_SERVICE"
service = "ubm-hyogo-api-staging"

[[env.production.services]]
binding = "API_SERVICE"
service = "ubm-hyogo-api-production"
```

top-level に書いても env 継承されないため、staging / production 両方に明示する（OpenNext env 分離原則と同じ。`deployment-cloudflare-opennext-workers.md` §8 参照）。

## 3. /auth/session-resolve internal-only endpoint

apps/api 側で D1 lookup を担う internal endpoint。Auth.js signIn callback から呼ばれ、Google から取得した email を D1 の `members` / `admins` と突合し `memberId` / `isAdmin` を返す。

- 認証: `INTERNAL_AUTH_SECRET` を request header で検証（HMAC ではなく定数比較で十分。網外公開しない）
- fail-closed: secret 欠落 / 不一致 → 401 + unregistered 扱い（admin gate 漏れ防止）
- public 露出禁止: `apps/api` の router で internal prefix 配下に置き、外部 origin の CORS を拒否
- 戻り値は最小限（`memberId: string | null`, `isAdmin: boolean`）。プロフィール詳細は別 endpoint で取得

JWT claims に積んだ後、middleware/route handler は再度 D1 を呼ばずに claims を信頼する（rotation は session 期限で代替）。

## 4. OpenNext post-build worker patch

Auth.js v5 は `process.env.AUTH_SECRET` 等を直接参照する箇所があるが、Cloudflare Workers の edge runtime では `process.env` が build 時のスナップショットしか持たない。これを補正するため OpenNext build 後に `.open-next/worker.js` をパッチする。

- 実装: `scripts/patch-open-next-worker.mjs`
- 内容: `buildAuthEnv()` 関数を worker entry に注入し、Cloudflare `env`（fetch handler 第二引数）から `AUTH_*` / `INTERNAL_*` / `PUBLIC_API_BASE_URL` を抽出
- 二重経路:
  1. `globalThis.__UBM_AUTH_ENV__` に格納（同一 isolate 内の任意モジュールから参照可能）
  2. request header `x-ubm-auth-secret` 等として下位 fetch に伝播（service-binding 経由の internal call 用）

build pipeline には `apps/web/package.json` の `build:cloudflare` script の post-step として組み込む（`opennextjs-cloudflare build && node scripts/patch-open-next-worker.mjs`）。CI でも同じ順序を踏むこと。

## 5. Auth.js v5 env 層化

Auth.js が env を解決する優先順位を明示的に固定する。`apps/web/src/lib/auth.ts` の env getter で以下の順に try する：

1. **processEnv**: `process.env.X`（Node.js context / local dev で有効）
2. **globalEnv**: `globalThis.__UBM_AUTH_ENV__?.X`（OpenNext patch が注入）
3. **cloudflareEnv**: `getCloudflareContext().env.X`（runtime-aware import）
4. **requestEnv**: request header `x-ubm-*` から抽出（service-binding 経路の最終手段）

staging のみ各層の解決結果を `console.log` で可視化する（transport / response の env 層を診断するため）。production では disable して秘匿値漏洩を防ぐ（`ENVIRONMENT === "production"` 分岐）。

# 落とし穴チェックリスト

新しい OAuth/auth 関連タスクを開始する前に確認する。

- [ ] `[[env.staging.services]]` と `[[env.production.services]]` 両方に `API_SERVICE` binding が宣言されているか（top-level 継承不可）
- [ ] `AUTH_SECRET` が apps/web の staging / production secret に設定されているか（`bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env <env>`）
- [ ] `INTERNAL_AUTH_SECRET` が **web/api 両 worker に同一値** で設定されているか（不一致だと無言で 401 → unregistered ループ）
- [ ] OpenNext post-build patch (`scripts/patch-open-next-worker.mjs`) が `build:cloudflare` script の最後で必ず実行されるか
- [ ] middleware が D1 を直接呼んでいないか（edge では D1 binding が無いため build は通るが runtime で fail）
- [ ] `/auth/session-resolve` が public origin から呼べないことを smoke test で確認したか（外部 curl で 401/403 を返すこと）
- [ ] Google OAuth verification 用に `apps/web/app/privacy/page.tsx` と `apps/web/app/terms/page.tsx` が公開可能な状態で deploy されているか
  - 2026-05-03 task-389 local state: pages + semantic tests implemented locally, including canonical/robots metadata, contact href, revision date, Cookie / Analytics note, and anti-social forces clause.
  - Runtime state: staging / production HTTP 200 and OAuth consent screen screenshot remain pending until web build is green and deploy / Cloud Console operations are user-approved.
- [ ] `gate=admin` / `gate=unregistered` / `gate=expired` の各 redirect path が UI で文言分岐されているか
- [ ] `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` が staging / production で別値（dev クライアント混入禁止）
- [ ] OAuth redirect URI に staging / production の両 worker URL が Google Cloud Console 側で登録されているか

# 関連 lessons-learned

- L-05A-007 〜 L-05A-011（`lessons-learned/_legacy-lessons-learned-05a-authjs-admin-gate-2026-04.md` または fragment dir 配下の 05a 系 entry）
  - L-05A-007: workers.dev loopback 404 → service-binding 切替
  - L-05A-008: process.env 不完全 → OpenNext post-build patch
  - L-05A-009: middleware で D1 を呼ぼうとして edge runtime で fail
  - L-05A-010: Google OAuth verification で privacy/terms 公開ページ要求
  - L-05A-011: INTERNAL_AUTH_SECRET 不一致時の沈黙ループ → fail-closed 明示

# 関連実装ファイル

| 役割 | パス |
| --- | --- |
| edge middleware | `apps/web/middleware.ts` |
| Auth.js 設定 / env 層化 | `apps/web/src/lib/auth.ts` |
| internal fetch helper | `apps/web/src/lib/fetch/public.ts` |
| web wrangler config | `apps/web/wrangler.toml` |
| api wrangler config | `apps/api/wrangler.toml` |
| OpenNext post-build patch | `scripts/patch-open-next-worker.mjs` |
| privacy 公開ページ | `apps/web/app/privacy/page.tsx` |
| terms 公開ページ | `apps/web/app/terms/page.tsx` |
| privacy / terms implementation workflow | `docs/30-workflows/task-389-privacy-terms-pages-impl/` |
| session-resolve handler | `apps/api/src/routes/auth/session-resolve.ts`（pending: 実装 path 要確認） |

# 関連 specs

| ファイル | 内容 |
| --- | --- |
| `docs/00-getting-started-manual/specs/02-auth.md` | 認証設計（admin gate / 会員区分） |
| `docs/00-getting-started-manual/specs/13-mvp-auth.md` | MVP 認証方針（Google OAuth + Magic Link） |

# 関連 reference（重複回避）

本 reference はハブとして以下に link し、詳細はそれぞれを正本とする：

- `architecture-auth-security-core.md` / `architecture-auth-security-details.md`: 一般的な auth 設計原則・状態遷移（注: Electron/Supabase 系記述は UBM-Hyogo 範囲外）
- `deployment-cloudflare-opennext-workers.md`: OpenNext / wrangler.toml 形式・env 分離・bundle size ガード
- `interfaces-auth-core.md`: AuthUser / UserProfile 等の型定義（旧 Desktop 版だが UBM-Hyogo でも参考可）
- `environment-variables.md`: 各 env var の op 参照値・設定経路の正本

## 変更履歴

| 日付 | バージョン | 変更内容 |
| --- | --- | --- |
| 2026-05-01 | 1.0.0 | 新規作成（05a-followup の Google OAuth + Cloudflare Workers + OpenNext 統合パターンをハブ化） |
