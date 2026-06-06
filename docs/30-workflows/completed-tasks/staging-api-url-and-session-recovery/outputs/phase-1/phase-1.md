# Phase 1: 要件定義

## 目的

ステージングの 2 症状（localhost アドレス / セッション取得失敗）の **真の論点**を主問題 1 文で固定し、
因果・責務境界・受入条件・命名規則を確定して Phase 2 設計へ渡す。

## 真の論点（主問題 1 文）

> **`apps/web`（Cloudflare Workers / OpenNext）から同一 Cloudflare account 上の API Worker へ「外向き HTTP fetch」する経路が、staging/production で構造的に壊れている**
> — 同一 account の `*.workers.dev` への loopback fetch は 404 を返し、かつ client bundle では
> API base URL が `localhost` に fallback する。これが「セッション取得失敗(S2)」と「localhost(S3)」の共通の根。

`why now`: ステージング常用が始まり `/profile`（認証必須・server fetch）と client 直叩き経路が実トラフィックに乗ったため顕在化。
`why this way`: 先行 `task-05a-fetchpublic-service-binding-001` が `public.ts` だけを service-binding 化し、`authed.ts`/各 proxy/auth route を取りこぼしたため、修正が「public 経路のみ」で止まっていた。

## 因果分析

### 強化ループ / バランスループ

- **バランスループ（壊れている）**: 「web→api 通信を増やす」→「loopback 404 / localhost fallback で失敗」→「セッション取得失敗 → 再ログイン誘導 → 再度 web→api 通信」。失敗が解消されないまま再試行が回る。
- **是正ループ（導入したい）**: 「service-binding 経由で web→api」→「同一 account でも 200」→「セッション解決成功」→「失敗ループ停止」。

### S2（セッション取得失敗）の決定的因果チェーン

```
/profile (server component, force-dynamic)
  └─ fetchAuthed<MeSessionResponse>("/me")           # apps/web/src/lib/fetch/authed.ts
       └─ resolveApiBase() = INTERNAL_API_BASE_URL    # staging = https://ubm-hyogo-api-staging.daishimanju.workers.dev（正しい）
       └─ fetch(`${base}/me`, {cookie 転送})           # ★ plain fetch（service binding 未使用）
            └─ 同一 account workers.dev への外向き fetch = Cloudflare loopback → 404
  └─ safeServerFetch が 404 を MEMBER_SESSION_404 にマップ
  └─ page.tsx:53-63「セッション情報を取得できませんでした」+ 再ログイン CTA を描画
```

根拠:
- `apps/web/src/lib/fetch/public.ts:6-8` のコメント: *「production/staging では service-binding `API_SERVICE.fetch()` を常に優先（同一 account workers.dev への外向き fetch loopback 404 を回避）」* — public 経路はこの回避を実装済み。
- `apps/web/src/lib/fetch/authed.ts:40-51` — `resolveApiBase()` + `fetch(url)` のみ。**service binding 不使用**。`getApiBaseEnv()`（env.ts:144-153）は `API_SERVICE` を返さない。
- `apps/web/app/api/me/[...path]/route.ts:43,59` — proxy も plain `fetch(target)`。`FALLBACK_INTERNAL_API="http://127.0.0.1:8787"`（route.ts:12）。
- 401 ではなく **404** が表示される事実は「sessionGuard 到達前（= API ルーティング層 / loopback）で失敗」を示す。`sessionGuard` は 401/410 のみ返す（`apps/api/src/middleware/session-guard.ts:78-99`）。AUTH_SECRET 起因なら 401 → `AuthRequiredError` → `/login` redirect（page.tsx:46-47）になり、エラーカードは出ない。→ 主因は loopback 404。

### S3（localhost 焼き込み）の因果

```
client component が API を叩く / SSG 評価
  └─ getPublicFetchEnv().PUBLIC_API_BASE_URL            # env.ts:155-172
       └─ PUBLIC_API_BASE_URL は NEXT_PUBLIC_ 接頭辞なし
            └─ Next.js が client bundle に inline しない
            └─ client runtime: process.env 空 + getCloudflareContext() は server 専用で throw → undefined
  └─ getBaseUrl() = undefined ?? "http://localhost:8787"  # public.ts:21,24
  └─ fetch("http://localhost:8787...") → ERR_CONNECTION_REFUSED
```

根拠: `apps/web/src/lib/env.ts:6-7`（`NEXT_PUBLIC_API_BASE_URL` と `PUBLIC_API_BASE_URL` の二重定義）, `public.ts:21-25`, `env.ts:80-106`（`readRawEnv` の cloudflare→process fallback）。

### S1（拡張機能ノイズ）の非該当根拠

- `content.js:21` の `POST http://127.0.0.1:8888/` — `content.js` はブラウザ拡張の content script 命名規約。当リポジトリに `content.js` は存在しない（`apps/web/.open-next` のバンドル名は hash 付き `index-*.js`）。
- `index-BusXyNuZ.js:13319 [Sentry] You cannot use Sentry.init() in a browser extension` — Sentry SDK が「拡張機能コンテキストでの init」を検出して警告。当アプリの Sentry init は Worker / browser tab 上で走り、拡張ではない。
- → S1 は修正対象外。ただし「localhost が見える」というユーザー懸念には S3 の恒久根絶 + grep gate で応える。

## 責務境界 / 状態所有権

| 層 | 責務 | 状態所有 |
|----|------|---------|
| `env.ts`（公開アクセサ） | env の単一読取口。service binding の expose 含む | env 値・`API_SERVICE` binding |
| `fetch/public.ts` | 公開 API への transport（binding 優先） | transport 選択 |
| `fetch/authed.ts` | 認証付き server fetch の transport（binding 優先・cookie 転送） | transport 選択・cookie header |
| `app/api/*/route.ts`（proxy） | browser→backend の cookie forward 専用 | request header forward |
| `apps/api` sessionGuard / resolver | JWT verify（AUTH_SECRET）+ memberId 解決 | session 真偽 |
| `scripts/` + CI gate | localhost 焼き込み検出 / secret parity 診断 / smoke | 検証 |

混在禁止: transport 選択ロジックを各 route に重複実装しない（Lane A は env.ts に binding expose を集約し、各所はアクセサ経由）。

## スコープ（含む / 含まない）

含む: Lane A/B/C のコード・config・script・CI gate 変更を「実装可能粒度」で仕様化。
含まない: commit・PR・`cf.sh secret put` 実走・staging deploy（すべて user-gated）。コード実装は本サイクルで完了。

## 既存コード命名規則（Phase 4 TDD 整合のため記録）

- ファイル: kebab-case（`verify-magic-link.ts`, `me-session-resolver.ts`）。テストは `*.spec.ts(x)` のみ（不変条件 #8、`*.test.*` 禁止）。
- env アクセサ: `get<Scope>Env()` / `get<Scope>FetchEnv()`（camelCase, `Env` suffix）。
- transport helper: `fetchPublic` / `fetchAuthed`（camelCase 動詞 + 名詞）。
- service binding 名: `API_SERVICE`（SCREAMING_SNAKE、wrangler.toml と一致）。
- 新規 script: `scripts/<verb>-<noun>.sh`（既存 `verify-pr-ready.sh` / `with-env.sh` に倣う）。

## タスク分類

- **UI task / docs-only task の別**: 実装タスク（NON_VISUAL）。docs-only ではない（コード変更が目的達成に必須 → CONST_004 デフォルト適用）。
- Phase 11: NON_VISUAL（source-level 自動テスト + user-gated staging runtime smoke）。screenshot は n/a、staging で /profile が復旧する VISUAL_ON_EXECUTION 証跡は user-gated。

## 受入条件（Acceptance Criteria）

| AC | 内容 | レーン | 検証 |
|----|------|--------|------|
| AC-1 | staging/production で `fetchAuthed` が `API_SERVICE` binding 経由で API を叩き、`/me` が 200 を返す（loopback 404 解消） | A | unit（binding 優先選択）+ staging smoke（user-gated） |
| AC-2 | `/api/me` `/api/admin` `/api/auth/*` proxy / magic-link 経路も binding 優先。binding 不在の local のみ HTTP fallback | A | unit + 既存 contract spec |
| AC-3 | localhost / `127.0.0.1` fallback は `ENVIRONMENT==="local"`（または binding 不在 & test）のときだけ到達。staging/production では到達不能 | A,B | unit（env 別分岐）|
| AC-4 | client から参照する API base URL は `NEXT_PUBLIC_API_BASE_URL`（inline 済）を使用し、client bundle に `localhost:8787` が現れない | B | grep gate（bundle scan）+ unit |
| AC-5 | grep gate が `:8888` だけでなく `:8787` / `localhost` の `apps/web/src` 焼き込み・client bundle 混入を検出 | C | gate 自体の self-test |
| AC-6 | `AUTH_SECRET` の web↔api staging parity を診断する script があり、不一致/欠落を非 0 で報告。投入は `cf.sh secret put` ラッパ（user-gated） | C | script dry-run |
| AC-7 | staging runtime smoke script が `/me` の 200 / `/profile` の認証描画を curl 検証（user-gated 実走） | C | script 構文 + user-gated 実走 |
| AC-8 | `pnpm typecheck` / `pnpm lint` / 対象 vitest / `verify-pr-ready.sh` すべて緑 | A,B,C | 実装サイクルで実行 |

## carry-over 確認

- `git log --oneline -5`: 直近 `dad98d2a8 fix: /profile リロード時の GET /me 404 を解消し再ログイン導線を追加 (#1113)`。#1113 は trailing-slash 308 と proxy の `/me/`→`/me` 整形と再ログイン CTA を入れたが、**loopback 404（plain fetch）と localhost fallback は未解決**。本 workflow がその残課題を完結する。
