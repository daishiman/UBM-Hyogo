# Phase 2: 設計

## メタ情報
- workflow: profile-me-404-authenticated-admin-recovery
- SSOT: `_shared-context.md`
- 対象: T01〜T04 の topology・契約・ログ設計・state ownership

## 目的
F-1〜F-9 を踏まえ、**S1/S2 のいずれが真因でも復旧し、再発時は data-cause を staging ログだけで一意特定できる**多層防御（T01〜T04）の設計を確定する。

## 実行タスク

### 2.1 topology（SubAgent lane / 並列性）
```
T01 (apps/api notFound 観測性)  ── 直列・最初（観測の土台）
        │
        ├── T02 (apps/api 自動 CD + smoke gate)   ┐ 並列
        └── T03 (apps/web route-404 ログ)          ┘
T04 (diagnose script 拡張)  ── 独立並列（いつでも可）
```
- 直列締め: 検証 lane（typecheck/lint/test/yaml 構文/redaction grep）は Phase 9 で直列実行。

### 2.2 T01 設計 — notFound 構造化診断ログ（D-B 根治 / AC-2）
- 対象: `apps/api/src/middleware/error-handler.ts` の `notFoundHandler`。
- 方針: 既存 `errorHandler` 経由のログ（`logError({code, status, message, path, method, ...})`）に加え、**route 未マッチを明示する診断フィールド**を付与。具体的には notFound 時に `logError` の `context` へ `{ reason: "route_not_matched", method, path, hasAuthorization: boolean, hasSessionCookie: boolean }` を渡す（**cookie 値・JWT 生文字列は出力しない**。存在有無の boolean のみ）。
- 不変: 応答 body（`UBM-1404` ApiError JSON）・status 404 は変更しない。
- 効果: `/me` が notFound で 404 になっているのか（S1）、別レイヤなのかをログで判別可能にする。`hasSessionCookie=true` かつ `path=/me` の notFound は「認証 cookie は届いているが route 未マッチ」= S1 を強く示す。
- セキュリティ: boolean 化で secret 非漏洩（AC-9）。

### 2.3 T02 設計 — apps/api 自動 CD + post-deploy smoke gate（S1/D-A 根治 / AC-3）
- 新規 `.github/workflows/api-cd.yml`。`web-cd.yml` を正本テンプレとし、deploy 対象を `apps/api/wrangler.toml` に置換。
- トリガ: `push` to `dev`（→ staging）/ `push` to `main`（→ production）。`paths` フィルタで `apps/api/**` / `packages/shared/**` / `.github/workflows/api-cd.yml` の変更時に発火（drift を確実に解消するため、過剰発火より取りこぼし無しを優先）。
- deploy step: `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging`（/ `--env production`）。**`wrangler` 直叩き禁止・`scripts/cf.sh` 経由必須**（CLAUDE.md）。
- secret: `CLOUDFLARE_API_TOKEN` を step-scoped env で渡す（web-cd.yml の安全パターン踏襲・job-level 配置禁止）。redaction-check step を踏襲。
- **post-deploy smoke gate（`needs: deploy-staging`）**:
  - prereq skip 分岐（`STAGING_*` secret 欠落時は `::notice::` で skip・exit 0）を web-cd.yml と同型で実装。
  - probe-1: `GET {API}/me/healthz` が 200（route 層が生きている確認）。
  - probe-2: `scripts/smoke/mint-staging-session-cookie.mts` で minted admin cookie を発行し `GET {API}/me`（または web 経由 `/profile`）が **200**（認証 `/me` の到達確認）。これにより S1（route 未マッチ）を CI で検出可能にする。
  - probe-1 が 200 かつ probe-2 が 404 の場合 = 「healthz は通るが /me が notFound」= S1 を CI が fail 検出。
  - 既存資産流用: `scripts/smoke/runtime-admin-web.sh` / `mint-staging-session-cookie.mts`。api 直 probe 用に `scripts/smoke/runtime-admin-api.sh` を新設（または web smoke の probe URL に `/me/healthz`・`/me` を追加）。
  - redaction grep gate（`__Secure-authjs.session-token=...` 等を ci-evidence から検出して fail）を web-cd.yml と同型で実装。
- 不変: `apps/api/wrangler.toml` の binding/vars は変更しない（deploy 設定の参照のみ）。

### 2.4 T03 設計 — web route-404 の明示記録（AC-4）
- 対象: `apps/web/src/lib/server-fetch/safe-fetch.ts`（`logServerFetchFailure`）/ 必要時 `apps/web/src/lib/fetch/authed.ts`。
- 方針: 既存 `server_fetch_failed` ログは status と transport descriptor を出すが、**route-not-found（404）を明示するフラグ**を追加して S1/S2 切り分けを容易化。具体的には `code` が `*_404` のとき `routeNotFound: true` を payload に含める（`FetchAuthedError.transport` 由来の `transportKind`/`baseHost` は既存どおり同梱）。
- 不変: `/me` の path/shape、`session-error-display.ts` の文言・分岐、page.tsx の redirect/notFound 挙動は**一切変更しない**（AC-6）。挙動を変えず観測フィールドのみ追加。
- 効果: web ログで「どの transport（service-binding / http）が 404 を返したか」が確定 → S1 vs S2 切り分け。

### 2.5 T04 設計 — 診断スクリプト拡張（AC-5）
- 対象: `scripts/diagnose-profile-session.sh`。read-only・冪等・secret 非出力。
- 追加 probe: (a) `GET {API}/me/healthz` と `GET {API}/me`（無認証）の status 対比 → route 存在差分（healthz=200 かつ /me=404 は route 設定異常の sign / /me=401 は route 健全・認証層到達）。(b) web worker と api worker の deploy version（`x-opennext` / response header / `cf.sh` version 参照可能なら）で parity チェック → drift 検知。
- 出力は status code と判定ラベルのみ。cookie/JWT/memberId/secret を**一切出力しない**（AC-9・redaction grep 対象）。

### 2.6 因果ループ・state ownership
SSOT `_shared-context.md` §3（因果ループ B1/R1/B2）・§4（state ownership）を正本とする。設計上の要点:
- R1（web のみ自動 deploy → drift 拡大）を T02 が断つ = **根治**。
- B2（観測 → data-cause 特定 → 最小修正）を T01/T03/T04 が成立させる = **再発時の即応性**。

### 2.7 ライブラリ/プラットフォーム選定の実測確認（FB-CRONVL-001 類似の予防）
- Cloudflare service binding の `cache: "no-store"` 受理性、notFound 時の status 体系は既存挙動を変えない（新規ライブラリ採用なし）。
- api-cd.yml は `wrangler-action` ではなく `scripts/cf.sh` 経由（web-cd.yml と同方式）に統一し、OIDC/secret 配線の差異を持ち込まない。

## 完了条件
- [x] T01〜T04 の topology・契約・ログ schema・不変条件が設計として固定されている。
- [x] notFound ログ・smoke gate・web route-404 ログ・診断 probe の secret 非漏洩（boolean/status のみ）が設計に明記されている。
- [x] api-cd.yml が web-cd.yml を正本テンプレとし `scripts/cf.sh` 経由 deploy であることが固定されている。

## 成果物
- 本ファイル `outputs/phase-2/phase-2.md`

## 参照資料
- `_shared-context.md`（SSOT §2〜§4）
- `.github/workflows/web-cd.yml`（api-cd.yml テンプレ・smoke gate 同型）
- `apps/api/src/middleware/error-handler.ts`（notFoundHandler）
- `apps/web/src/lib/server-fetch/safe-fetch.ts`（server_fetch_failed）
- `scripts/diagnose-profile-session.sh` / `scripts/smoke/mint-staging-session-cookie.mts` / `scripts/cf.sh`

## 統合テスト連携
- T01/T03 の構造化ログ payload は unit test で固定（Phase 4 RED）。
- T02 の prereq skip 分岐・probe URL は yaml 構文 + shell `bash -n` で検証（Phase 9）。
- 既存再利用可否（FB-SDK-07-1）: smoke は既存 `mint-staging-session-cookie.mts` / `runtime-admin-web.sh` を再利用し新規 UI/script を最小化。
