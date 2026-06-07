# Phase 12: 実装ガイド（implementation-guide）

## メタ情報

| 項目 | 値 |
|------|-----|
| workflow | `staging-api-url-and-session-recovery` |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| implementation_mode | new |
| workflow_state | implemented_local_evidence_captured |
| lane | A（server fetch service-binding 統一）/ B（client localhost 焼き込み根絶）/ C（CF secret parity + grep gate + smoke） |
| 1 サイクル 1 PR | CONST_007（3 lane 同梱） |

## Part 1: 中学生レベルの概念説明（なぜ → 何を）

### なぜこの修正が必要か（日常の例え話）

同じビル（同じ Cloudflare アカウント）の中に「Web 受付（apps/web）」と「データ係（apps/api）」という 2 つの部署があります。
受付がデータ係に問い合わせるとき、いまは **わざわざ建物の外に出て、外線電話で自分のビルの代表番号にかけ直して** います。
ところが同じビルの代表番号に外からかけ直すと電話がループしてつながらず「該当者なし（404）」と返ってきてしまう。
これが「ログイン情報を取得できませんでした」と画面に出る本当の原因です。正しくは **内線電話（service binding）** を使って、
建物の外に出ずに直接データ係を呼べばよいのです。受付の一部の窓口（public 経路）はすでに内線に直していましたが、
ログイン確認の窓口（authed / 各 proxy / magic-link）が外線のまま取り残されていたので、今回そこを全部内線にそろえます。

### 何をするか

まず、外線・内線のどちらでかけるかを毎回その場で判断していたのを、**1 つの受付係（`resolveApiFetch`）に集約** します。
この受付係は「テスト中ならテスト用番号」「内線があれば内線」「内線が無くても住所が分かれば外線」「自宅（local）なら最終手段で localhost」
「会社（staging/production）で内線も住所も無いなら、黙って localhost にかけ直さずにきっぱりエラーで止める（fail-closed）」という順で決めます。
次に、ブラウザに配るプリント（client bundle）に「自宅の住所（localhost:8787）」が刷り込まれてしまう問題を直し、
ブラウザでも読める正しい名前（`NEXT_PUBLIC_API_BASE_URL`）に統一します。最後に、本物の合鍵（AUTH_SECRET）が
受付とデータ係で同じかどうかを安全に点検する道具と、localhost が紛れ込んでいないか見張る自動チェックを用意します。

### 今回作ったもの

- 内線/外線を 1 か所で決める受付係（新規ファイル `transport.ts` の `resolveApiFetch`）。
- ログイン確認・各 proxy・magic-link をすべて内線優先に切り替え（`authed.ts` ほか）。
- ブラウザに正しい名前が届くように環境変数を統一（`NEXT_PUBLIC_API_BASE_URL`）。
- 合鍵が一致しているかを安全に点検する道具と、localhost 混入を見張る自動チェック、staging での疎通確認の道具（`scripts/` 一式 + CI gate）。

## Part 2: 技術者向け実装ガイド

### 背景

`apps/web`（Cloudflare Workers / OpenNext）から同一 account の API Worker（`ubm-hyogo-api-staging`）へ plain `fetch()` で
外向き HTTP すると、同一 account の `*.workers.dev` 宛 loopback で **404** を返す。`/profile`（server component）の
`fetchAuthed<MeSessionResponse>("/me")` がこの 404 を `MEMBER_SESSION_404` にマップし「セッション情報を取得できませんでした」を描画していた。
401 ではなく 404 である事実が「sessionGuard 到達前のルーティング層 = loopback での失敗」を示す（`session-guard.ts:78-99` は 401/410 のみ）。
先行 `task-05a-fetchpublic-service-binding-001` が `public.ts` だけを service-binding 化した取りこぼしが構造原因。

### 要約

3 lane を 1 PR で完結する。Lane A は server-side fetch 全経路（`fetchAuthed` / `/api/me` / `/api/admin` / `/api/auth/*` / magic-link）を
`API_SERVICE` binding 優先へ統一し、localhost fallback を `local` 限定（fail-closed）にする。Lane B は client bundle が参照する
API base URL を `NEXT_PUBLIC_API_BASE_URL`（build inline）へ統一し、`localhost:8787` 焼き込みを根絶する。Lane C は AUTH_SECRET の
web↔api parity 診断 / 投入ラッパ、`:8787`/`:8888`/`localhost` を検出する grep gate と CI job、`/me` staging runtime smoke を新設する。

### 実装ステップ

T01..T03 を Lane A→B→C の順で実装し、各 lane で typecheck / lint / 対象 vitest を緑化してから次へ進む（1 PR 同梱）。

#### T01: Lane A — server-side fetch の service-binding 統一

`apps/web/src/lib/fetch/transport.ts` を新規追加し、transport 選択を `resolveApiFetch` に単一化する。
`authed.ts` / `app/api/me/[...path]/route.ts` / `app/api/admin/[...path]/route.ts` / `app/api/auth/magic-link/route.ts` /
`app/api/auth/magic-link/verify/route.ts` / `app/api/auth/gate-state/route.ts` / `src/lib/auth/verify-magic-link.ts` を
`resolveApiFetch()` 経由へ置換。`FALLBACK_INTERNAL_API` / `LOCAL_DEV_FALLBACK = "http://127.0.0.1:8787"` 定数は削除し、
local fallback は `resolveApiFetch` の (d) 分岐（`http://localhost:8787`）へ集約。`env.ts` に `getEnvironment()` /
`getTransportRuntimeIsTest()` を追記（`process.env.*` 直参照は禁止・admin route の既存直参照も除去）。

#### T02: Lane B — client bundle の localhost 焼き込み根絶

`apps/web/src/lib/fetch/public.ts` の `getBaseUrl()` を `NEXT_PUBLIC_API_BASE_URL ?? PUBLIC_API_BASE_URL` 優先・
local 限定 fallback・非 local throw（fail-closed）へ改修。`env.ts` の `PublicFetchEnv` interface に
`NEXT_PUBLIC_API_BASE_URL?: string` を追加し、`getPublicFetchEnv()` で `process.env` / `rawEnv` 双方から解決
（`NEXT_PUBLIC_*` は build inline なので client でも `process.env` 参照で値が入る）。`DEFAULT_BASE_URL` のリテラルは
local 分岐へ移し `// localhost-allow:local-fallback` allowlist コメントを付与（Lane C grep gate と整合）。
`wrangler.toml` / `web-cd.yml` の `NEXT_PUBLIC_API_BASE_URL` は現状維持（確認のみ・削除禁止）。

#### T03: Lane C — CF secret parity + grep gate + staging smoke

`scripts/diagnose-auth-secret-parity.sh`（read-only / presence のみ）、`scripts/cf-secret-put-auth-secret.sh`（user-gated 投入 / `--check` dry-run / min32 強制）、
`scripts/verify-no-localhost-bake.sh`（`:8787`/`:8888`/`localhost` を src + client bundle で検出）、
`scripts/verify-no-localhost-bake.spec.ts`（self-test）、`scripts/smoke-staging-me.sh`（`/me` 200 + memberId / `/profile` 認証描画 / user-gated 実走）、
`.github/workflows/verify-no-localhost-bake.yml`（CI gate）を新設。secret 値・cookie・bearer は一切出力しない（presence-only / redact）。

### APIシグネチャ

設計（phase-2.md / task-a）から引用（手書き drift 回避）。

```ts
// apps/web/src/lib/fetch/transport.ts（新規）
export interface ApiTransportEnv {
  /** Workers binding。staging / production で wrangler.toml [[services]] により注入される。 */
  API_SERVICE?: { fetch: typeof fetch };
  /** 解決済みの HTTP base URL（INTERNAL_API_BASE_URL or PUBLIC_API_BASE_URL）。末尾 / は正規化推奨。 */
  baseUrl?: string;
  /** 実行環境。fail-closed 判定に使う。 */
  environment?: "local" | "staging" | "production";
  /** test / Playwright 実行中か（NODE_ENV==="test" || PLAYWRIGHT_TEST==="1"）。 */
  isTest?: boolean;
}

export type ApiTransport =
  | { kind: "service-binding"; fetch: typeof fetch }
  | { kind: "http"; baseUrl: string };

/** transport を 1 箇所で決定する（判定優先順は §エッジケースの表）。全条件不一致（非 local）は throw。 */
export function resolveApiFetch(env: ApiTransportEnv): ApiTransport;

/** service-binding 経由 URL を組む。host は worker 側で無視されるが URL parse のため固定 host を使う。 */
export const SERVICE_BINDING_ORIGIN = "https://service-binding.local";
```

```ts
// apps/web/src/lib/env.ts（追記）
export function getEnvironment(rawEnv?: RawEnv): "local" | "staging" | "production";
export function getTransportRuntimeIsTest(rawEnv?: RawEnv): boolean;
```

```ts
// apps/web/src/lib/env.ts（PublicFetchEnv 拡張）
export interface PublicFetchEnv {
  API_SERVICE?: ServiceBinding;
  NEXT_PUBLIC_API_BASE_URL?: string; // build inline / client で解決可能（優先）
  PUBLIC_API_BASE_URL?: string;      // server-only / 後方互換
  NODE_ENV?: string;
  PLAYWRIGHT_TEST?: string;
}
export function getPublicFetchEnv(rawEnv?: RawEnv): PublicFetchEnv; // NEXT_PUBLIC_API_BASE_URL を含めて返す
```

```ts
// apps/web/src/lib/fetch/authed.ts（シグネチャ不変・内部 transport のみ差替）
export const fetchAuthed = async <T>(path: string, init?: RequestInit): Promise<T>;
```

### 使用例

```ts
// server component / route 内（authed 経路）
const env = getAuthEnv(); // API_SERVICE / INTERNAL_API_BASE_URL を返す
const transport = resolveApiFetch({
  API_SERVICE: env.API_SERVICE,
  baseUrl: env.INTERNAL_API_BASE_URL?.replace(/\/$/, ""),
  environment: getEnvironment(),
  isTest: getTransportRuntimeIsTest(),
});
const res =
  transport.kind === "service-binding"
    ? await transport.fetch(`${SERVICE_BINDING_ORIGIN}${path}`, { ...init, headers, cache: "no-store" })
    : await fetch(`${transport.baseUrl}${path}`, { ...init, headers, cache: "no-store" });
```

### エラーハンドリング

- staging / production で `API_SERVICE` binding も base URL も無い場合は `resolveApiFetch` が **throw**（fail-closed）。
  silent な localhost fallback を禁止（AC-3）。throw は `apps/web/src/app/error.tsx`（task-05 error boundary）で補足される設計。
- `fetchAuthed`: 401 → `AuthRequiredError`（`/login` redirect）、非 2xx → `FetchAuthedError`（現状維持）。
- admin route: `resolveApiFetch` throw を try/catch し既存の fail-fast 500（`internal_api_base_url_missing`）を維持。
- `verify-magic-link.ts`: 通信失敗 / 想定外 shape は `temporary_failure` への fail-closed 変換を現状維持。
- Lane C: secret 値・token・cookie を stdout/stderr/evidence に出さない。値一致は `/me` 200 で間接証明（L-AUTHSECRET-001）。

### エッジケース

`resolveApiFetch` の判定優先順（上から評価し最初に一致した分岐を採用）:

| 評価順 | 条件 | 返り値 |
|--------|------|--------|
| (a) | `isTest && baseUrl` あり | `{ kind: "http", baseUrl }`（test mock 差替を binding より優先） |
| (b) | `API_SERVICE` あり | `{ kind: "service-binding", fetch }`（staging/production 正規経路・loopback 回避） |
| (c) | `baseUrl` あり（binding 無・非 test） | `{ kind: "http", baseUrl }`（local `next dev`） |
| (d) | 全無 & `environment === "local"` | `{ kind: "http", baseUrl: "http://localhost:8787" }`（local fallback のみ） |
| (e) | 全無 & 非 local | **throw**（fail-closed） |

- service-binding は host を無視するため `SERVICE_BINDING_ORIGIN` の固定 host を使い、`path` に `url.search` を連結してフルパスを渡す（search 保持）。
- `getServiceBinding()`（public.ts）が staging/production で先に binding を返すため、`getBaseUrl()` の throw は「binding も NEXT_PUBLIC も無い異常時」の保険。
- Playwright e2e は `NODE_ENV==="test"` 経路 (a) で HTTP mock API に落ち、既存期待 URL を保てる。

### 設定項目と定数一覧

| 設定 / 定数 | 場所 | 値・制約 |
|------------|------|---------|
| `ENVIRONMENT` | `wrangler.toml [vars]` / `getEnvironment()` | `local` / `staging` / `production`（既定 `local`） |
| `NEXT_PUBLIC_API_BASE_URL` | `wrangler.toml` 3 ブロック + `web-cd.yml` build env | client inline 用 API base URL（削除禁止） |
| `PUBLIC_API_BASE_URL` | `wrangler.toml` / `getPublicFetchEnv()` | server-only / 後方互換で残置（即削除しない） |
| `INTERNAL_API_BASE_URL` | `getAuthEnv()` / `getAdminFetchEnv()` | server-side authed/admin の HTTP base（binding 不在時のみ使用） |
| `API_SERVICE` | `wrangler.toml [[services]]` / `[[env.*.services]]` | service binding 名（SCREAMING_SNAKE） |
| `AUTH_SECRET` | Cloudflare Secrets（web/api 両 worker） | web↔api 同一値・**32 文字以上**（api min32 / web min16 だが parity は min32 に合わせる） |
| `SERVICE_BINDING_ORIGIN` | `transport.ts` | `https://service-binding.local`（URL parse 用ダミー host） |
| `LOCAL_FALLBACK_BASE_URL` | `transport.ts` / `public.ts` | `http://localhost:8787`（`// localhost-allow:local-fallback`） |

### テスト構成

| テスト | 対象 |
|--------|------|
| `apps/web/src/lib/fetch/transport.spec.ts`（新規） | `resolveApiFetch` の 5 分岐網羅（TC-A1..A5） |
| `apps/web/src/lib/fetch/authed.spec.ts`（編集） | binding 優先 / search 保持 / 401 / 非 2xx / source grep（`127.0.0.1` 不在） |
| `apps/web/src/lib/fetch/public.spec.ts`（編集） | NEXT_PUBLIC 優先 / local fallback / 非 local throw |
| `apps/web/src/lib/__tests__/env.spec.ts`（編集） | `getPublicFetchEnv` が `NEXT_PUBLIC_API_BASE_URL` を返す |
| `apps/web/app/api/me/[...path]/route.route.spec.ts`（新規） | proxy の binding 優先 / cookie / search 保持 |
| `scripts/verify-no-localhost-bake.spec.ts`（新規） | gate の self-test（dirty=exit1 / clean=exit0 / allowlist 許容） |

### 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  src/lib/fetch/transport.spec.ts src/lib/fetch/authed.spec.ts \
  src/lib/fetch/public.spec.ts src/lib/__tests__/env.spec.ts \
  app/api/me/'[...path]'/route.route.spec.ts
mise exec -- pnpm vitest run scripts/verify-no-localhost-bake.spec.ts
bash scripts/verify-no-localhost-bake.sh
bash scripts/verify-pr-ready.sh
```

### 既知制限

- `PUBLIC_API_BASE_URL` の env schema 完全削除は後方互換のため本サイクルでは行わない（未タスク候補として `unassigned-task-detection.md` に記録）。
- S1（`127.0.0.1:8888` / Sentry-in-extension）はブラウザ拡張由来でアプリ外。本タスクの修正対象外（懸念には Lane B 焼き込み根絶 + Lane C grep gate で応える）。
- staging runtime smoke（`/me` 200 / `/profile` 認証描画）は実 deploy / secret 投入を要するため **user-gated**。本 spec では実走しない。
- AUTH_SECRET の値一致は presence + `/me` 200 でのみ間接証明する（値・長さ・ハッシュは表示しない・L-AUTHSECRET-001）。

## 視覚証跡

UI/UX 変更なし（NON_VISUAL）のため Phase 11 スクリーンショットは不要。
代替証跡 = `outputs/phase-11/manual-test-result.md` + staging runtime smoke（`scripts/smoke-staging-me.sh` による `/me` 200 / `/profile` 認証描画・**user-gated**）。
副次的な「/profile がエラーカード → 実コンテンツ」へ変わる VISUAL_ON_EXECUTION 証跡は user-gated 実走時にのみ取得し、UI レンダリングコードは変更しない。

## 完了条件

- 3 lane の DoD（AC-1..AC-8）を満たし、`index.md` §1 の変更ファイル範囲のみを変更（lane 間で責務交差しない）。
- `transport.ts` / `authed.ts` に `127.0.0.1` 焼き込みが無く、local fallback は `localhost:8787`（allowlist コメント付き）1 系統に統一。
- client bundle（`.open-next/assets/*.js`）に `localhost:8787` が現れない（grep gate 0 件）。
- typecheck / lint / 対象 vitest / `verify-no-localhost-bake.sh` / `verify-pr-ready.sh` すべて緑。
- commit / push / PR / `cf.sh secret put` / staging deploy / runtime smoke は user-gated（CONST_002 / CONST_007 例外）。

## 成果物

- 実装ファイル: `transport.ts`（新規）/ `authed.ts` / `public.ts` / `env.ts` / 各 proxy・auth route / `verify-magic-link.ts` / `wrangler.toml` / `web-cd.yml`
- script: `diagnose-auth-secret-parity.sh` / `cf-secret-put-auth-secret.sh` / `verify-no-localhost-bake.sh` / `smoke-staging-me.sh`（新規）
- CI: `.github/workflows/verify-no-localhost-bake.yml`（新規）
- テスト: `transport.spec.ts` / `route.route.spec.ts` / `verify-no-localhost-bake.spec.ts`（新規）+ 既存 spec 編集

## 参照資料

- `outputs/phase-1/phase-1.md`（因果分析・AC 一覧）
- `outputs/phase-2/phase-2.md`（resolveApiFetch 判定表・lane 設計）
- `outputs/phase-3/phase-3.md`（設計レビュー GO）
- `tasks/task-a-server-fetch-service-binding.md` / `task-b-...md` / `task-c-...md`（CONST_005 6 項目）
- 関連 lessons: `task-staging-auth-secret-binding-recovery-001`（L-AUTHSECRET-001..003）
