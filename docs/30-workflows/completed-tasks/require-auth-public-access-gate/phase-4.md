# Phase 4: テスト作成（TDD Red）

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 4 / 13 |
| 名称 | テスト作成（TDD Red） |
| 種別 | 実行仕様（テスト先行） |
| 前提 | Phase 3 = PASS。AC-1〜AC-13 と命名規則が確定済み |
| 不変条件 | 新規テストは `*.spec.{ts,tsx}` のみ（不変条件 #8・`*.test.*` は lefthook `block-test-suffix` が reject）。D1 直接アクセスは `apps/api` に閉じる（#5）。`apps/web` env は `apps/web/src/lib/env.ts` アクセサ経由（task-02）。OKLch トークン正本（HEX 直書き禁止） |
| TDD 段階 | **Red**。この Phase の全テストは実装未着手のため FAIL する（コンパイルエラー含む）ことが期待値 |

## 目的

C1（Web UI 認証ゲート）と C2（API アクセスゲート + サーバー間内部認証）の受け入れ基準 AC-1〜AC-9 を、
実装前に **観測可能な失敗テスト**として固定する。各テストは「期待する観測値（描画分岐 / HTTP status / header 有無 / 呼び出し回数）」を 1 つに絞り、
Phase 5 実装が GREEN 化のゴールを一意に把握できる粒度にする。

新規 spec を実装ファイルより先に書くことで、テストが「実装の答え合わせ」ではなく「仕様の固定」になることを保証する。

## 実行タスク

下表の 6 spec ファイルを新規作成または既存追記し、全テストケース（TC-番号）を FAIL（Red）状態で確定する。

### 4.1 対象テストファイル一覧

| # | spec ファイル | 種別 | 対応 concern | 対応 AC |
|---|--------------|------|------------|--------|
| F1 | `apps/web/src/components/auth/LoginRequiredNotice.spec.tsx` | 新規 | C1 | AC-1, AC-2 |
| F2 | `apps/web/app/(public)/layout.spec.tsx` | 既存追記 | C1 | AC-1, AC-4, AC-5, AC-9 |
| F3 | `apps/api/src/middleware/require-public-access.spec.ts` | 新規 | C2 | AC-6, AC-9, M-2 |
| F4 | `apps/api/src/routes/public/index.contract.spec.ts` | 既存追記 | C2 | AC-6 |
| F5 | `apps/og/src/__tests__/member-source.spec.ts` | 既存追記 | C2 | AC-7 |
| F6 | `apps/web/app/__tests__/sitemap.spec.ts` | 新規（既存なし） | C2 | AC-7, AC-8 |

> F6 は `apps/web/app/sitemap.ts` の専用 spec が存在しないため新規作成する。配置は既存 `apps/web/app/__tests__/` ディレクトリ規約に合わせる。

### 4.2 各 spec のテストケース定義

#### F1: `LoginRequiredNotice.spec.tsx`（新規・C1）

`render(<LoginRequiredNotice redirectTo={...} />)` を `@testing-library/react` で検証する。Server Component だが props 純粋関数描画のため jsdom/happy-dom で render 可能。

| TC | 入力 | 検証する観測値 | 期待値 |
|----|------|--------------|--------|
| TC-1-1 | `redirectTo="/members"` | `getByTestId("login-required-notice")` の存在 | toBeInTheDocument |
| TC-1-2 | `redirectTo="/members"` | 見出しテキスト | 「ログインが必要です」を含む |
| TC-1-3 | `redirectTo="/members"` | CTA `getByTestId("login-required-notice-cta")` の `href` 属性 | `"/login?redirect=%2Fmembers"`（encodeURIComponent 結果） |
| TC-1-4 | `redirectTo="/members/abc def"` | CTA `href` | `"/login?redirect=%2Fmembers%2Fabc%20def"`（スペース・スラッシュが encode される） |
| TC-1-5 | props 省略（`redirectTo` 未指定） | CTA `href` | `"/login?redirect=%2F"`（既定 `"/"` を encode） |
| TC-1-6 | `redirectTo="/members"` | axe アクセシビリティ（`apps/web/src/test/axe` 利用） | violations 0 |

#### F2: `(public)/layout.spec.tsx`（既存追記・C1）

既存ファイルは `next/headers` と `SidebarShell.server` をスタブ化済み。これに **`getSession` のモックを追加**してゲート分岐を検証する。

モック方針:
- `vi.mock("../../src/lib/session", () => ({ getSession: vi.fn() }))` を追加し、`getSession` の戻り値を TC ごとに `mockResolvedValue(session)` / `mockResolvedValue(null)` / `mockRejectedValue(new Error(...))` で切替える。
- `next/headers` の `headers().get("x-pathname")` は既存 `headerStore.get` を流用し、`mockReturnValue("/members")` 等で固定する。
- `(public)` 配下の page データ取得が走らないことを検証するため、page の data fetch entrypoint（`apps/web/src/lib/api/public.ts` の公開取得関数）を `vi.mock` でスパイ化し、未認証分岐で **呼ばれない（`toHaveBeenCalledTimes(0)`）** ことを確認する。
- happy-dom の落とし穴回避: `window` 系のモックが必要な場合は `Object.defineProperty(window, "...", { value, configurable: true })` を用い、`vi.stubGlobal("window", ...)` は使用しない（happy-dom 環境で window 全置換は描画を壊す既知 pitfall）。

| TC | `getSession()` の戻り | `x-pathname` | 検証する観測値 | 期待値 |
|----|---------------------|--------------|--------------|--------|
| TC-2-1 | `null`（未認証） | `/members` | `getByTestId("login-required-notice")` | 描画される（notice 表示）AC-1 |
| TC-2-2 | `null`（未認証） | `/members` | `queryByTestId("sidebar-shell-stub")` | `null`（shell を描画しない・nav 漏れ防止） |
| TC-2-3 | `null`（未認証） | `/members` | notice CTA の `href` | `"/login?redirect=%2Fmembers"`（pathname 伝播 AC-2） |
| TC-2-4 | `{ user: {...} }`（認証済み） | `/members` | `getByTestId("sidebar-shell-stub")` と children | 描画される（従来どおり AC-4） |
| TC-2-5 | `{ user: {...} }`（認証済み） | `/members` | `queryByTestId("login-required-notice")` | `null`（notice 非表示） |
| TC-2-6 | `Promise.reject`（throw） | `/members` | `getByTestId("login-required-notice")` | 描画される（fail-closed・throw を catch して notice AC-9） |
| TC-2-7 | `null`（未認証） | `/members` | スパイ化した `public.ts` 取得関数の呼び出し回数 | `toHaveBeenCalledTimes(0)`（RSC データ取得が走らない AC-5） |
| TC-2-8 | `{ user: {...} }`（認証済み） | `/members` | axe（既存 axe ユーティリティ） | violations 0（回帰維持） |

#### F3: `require-public-access.spec.ts`（新規・C2）

`requirePublicAccess()` を Hono アプリにマウントし、`app.request(path, init, env)` で検証する。`internal-auth.ts` / `require-admin.authz.spec.ts` の既存テストパターン（`buildEnv` + `app.request`）に倣う。

JWT session の有効・無効は、既存 `@ubm-hyogo/shared` の `verifySessionJwt` が検証する形に合わせ、テストでは有効 JWT を `signSessionJwt`（既存 helper があれば再利用、なければ `require-admin.authz.spec.ts` が使う署名 helper を流用）で生成する。

| TC | リクエスト条件 | env | 検証する観測値 | 期待値 |
|----|--------------|-----|--------------|--------|
| TC-3-1 | 認証ヘッダ・Cookie・内部ヘッダ全て無し | `AUTH_SECRET` + `INTERNAL_AUTH_SECRET` 設定 | `res.status` | `401` |
| TC-3-2 | 401 時のレスポンス body | 同上 | `await res.json()` | `{ error: ... }` 形（既存 require-admin の 401 形に一致） |
| TC-3-3 | `Authorization: Bearer <有効 jwt>` | `AUTH_SECRET` 設定 | next() 到達（後段 handler が 200 を返す） | `200` |
| TC-3-4 | `Cookie: authjs.session-token=<有効 jwt>` | `AUTH_SECRET` 設定 | next() 到達 | `200` |
| TC-3-5 | `Authorization: Bearer <壊れた/期限切れ jwt>` | `AUTH_SECRET` 設定 | `res.status` | `401`（検証失敗で公開しない・fail-closed AC-9） |
| TC-3-6 | `X-Internal-Auth: <正しい secret>` | `INTERNAL_AUTH_SECRET` 設定 | next() 到達 | `200` |
| TC-3-7 | `X-Internal-Auth: <誤った secret>` | `INTERNAL_AUTH_SECRET` 設定 | `res.status` | `401` |
| TC-3-8 | `X-Internal-Auth: <値あり>` | `INTERNAL_AUTH_SECRET` **未設定**（M-2） | `res.status` | `401`（env 未設定の内部経路は通さない・fail-closed） |
| TC-3-9 | `X-Internal-Auth` 無し + `Cookie: authjs.session-token=<有効 jwt>` | `AUTH_SECRET` 設定・`INTERNAL_AUTH_SECRET` **未設定**（M-2） | `res.status` | `200`（内部 secret 未設定でも session 経路は通る） |
| TC-3-10 | `X-Internal-Auth` 比較が定数時間（timing-safe）であること | `INTERNAL_AUTH_SECRET` 設定 | 比較関数が長さ差・先頭一致で early-return しない実装で正誤判定が一致する（誤 secret は全長で 401・正 secret は 200） | TC-3-6 / TC-3-7 の status 一致（timing-safe 等値の機能的検証） |

> TC-3-10 は timing 計測ではなく「定数時間比較関数（例: `crypto.subtle.timingSafeEqual` 相当 / バイト長一致前提の XOR 比較）で正誤が機能的に正しく判定されること」を status で検証する。タイミング統計の計測は CI 上で不安定なため行わない。

#### F4: `index.contract.spec.ts`（既存追記・C2）

既存 contract spec は「session 非依存（誰でも 200）」を前提に書かれている。`requirePublicAccess` 適用後はこの前提が変わるため、**既存テストの env に内部認証ヘッダ付与へ更新**しつつ、新規 401/200 ケースを追記する。

- 既存の各 `app.request("/public/...", {}, env)` 呼び出しは、`{ headers: { "X-Internal-Auth": INTERNAL_AUTH_SECRET } }` を付与し env に `INTERNAL_AUTH_SECRET` を設定する形へ更新（200 を維持・回帰）。
- 4 endpoint（`/public/stats`, `/public/members`, `/public/members/:id`, `/public/form-preview`）について以下を追記する。

| TC | endpoint | リクエスト | env | 期待 status |
|----|----------|----------|-----|------------|
| TC-4-1 | `GET /public/stats` | 認証ヘッダ無し | secret 設定 | `401`（AC-6） |
| TC-4-2 | `GET /public/members` | 認証ヘッダ無し | secret 設定 | `401` |
| TC-4-3 | `GET /public/members/:id` | 認証ヘッダ無し | secret 設定 | `401` |
| TC-4-4 | `GET /public/form-preview` | 認証ヘッダ無し | secret 設定 | `401` |
| TC-4-5 | `GET /public/members` | `X-Internal-Auth: <正>` | secret 設定 | `200`（内部経路 AC-7） |
| TC-4-6 | `GET /public/members` | `Cookie: authjs.session-token=<有効 jwt>` | `AUTH_SECRET` 設定 | `200`（会員経路 AC-6） |

#### F5: `member-source.spec.ts`（既存追記・C2）

既存 spec は `API_SERVICE.fetch` のスパイ（`serviceFetch = vi.fn()`）と HTTP fallback を持つ。これに **内部認証ヘッダ付与の検証**を追記する。

| TC | 条件 | 検証する観測値 | 期待値 |
|----|------|--------------|--------|
| TC-5-1 | `env = { API_SERVICE, INTERNAL_AUTH_SECRET: "s3cr3t" }` で `fetchMemberSummary("m-1", env)` | `serviceFetch` 呼び出し引数の `Request` の `headers.get("X-Internal-Auth")` | `"s3cr3t"` |
| TC-5-2 | HTTP fallback（`NEXT_PUBLIC_API_BASE_URL` 経由・`INTERNAL_AUTH_SECRET: "s3cr3t"`） | `fetchImpl` 呼び出しの 2nd arg `init.headers["X-Internal-Auth"]`（または `Request` header） | `"s3cr3t"` |
| TC-5-3 | `env` に `INTERNAL_AUTH_SECRET` 未設定 | 付与される `X-Internal-Auth` 値 | `""`（空文字・`?? ""` フォールバック・実行時 throw しない） |

> `serviceFetch` の引数が `Request` インスタンスのため、`serviceFetch.mock.calls[0][0]` から `.headers.get("X-Internal-Auth")` を読む。`OgEnv` 型に `INTERNAL_AUTH_SECRET?: string` を追加する変更が前提（型エラーで Red になる）。

#### F6: `sitemap.spec.ts`（新規・C2）

`apps/web/app/sitemap.ts` の `default` export（`sitemap()` 関数）を呼び、`/public/members` への fetch に内部認証ヘッダが付くことを検証する。

モック方針:
- `global.fetch` を `vi.fn()` でスタブ（`Object.defineProperty(globalThis, "fetch", { value: spy, configurable: true })` または `vi.stubGlobal("fetch", spy)`。`window` ではなく `fetch` なので `stubGlobal` 可）。
- `apps/web/src/lib/env.ts` の env アクセサ（`getAuthEnv()` / `getAdminFetchEnv()`）を `vi.mock` し、`INTERNAL_AUTH_SECRET: "s3cr3t"` を返す。`process.env` 直接参照はしない（task-02 不変条件）。

| TC | 条件 | 検証する観測値 | 期待値 |
|----|------|--------------|--------|
| TC-6-1 | `sitemap()` 実行 | `fetch` 呼び出しの `init.headers["X-Internal-Auth"]` | `"s3cr3t"`（AC-7） |
| TC-6-2 | env アクセサが `INTERNAL_AUTH_SECRET` 未設定を返す | 付与される `X-Internal-Auth` 値 | `""`（空文字・throw しない） |
| TC-6-3 | env 参照経路 | spec 内で `process.env.INTERNAL_AUTH_SECRET` を直接読まず、モックした env アクセサ経由で値が流れること | アクセサ mock が呼ばれる（`toHaveBeenCalled`） |

## 参照資料

| 参照 | パス | 用途 |
|------|------|------|
| 設計（シグネチャ・データフロー） | `docs/30-workflows/completed-tasks/require-auth-public-access-gate/phase-2.md` | F1〜F6 の期待値根拠 |
| AC 定義 | `docs/30-workflows/completed-tasks/require-auth-public-access-gate/phase-1.md` §3 | TC と AC の対応 |
| 既存 layout spec | `apps/web/app/(public)/layout.spec.tsx` | F2 のモック流儀（next/headers / shell スタブ） |
| 既存 contract spec | `apps/api/src/routes/public/index.contract.spec.ts` | F4 の `buildEnv` / `app.request` パターン |
| 既存 authz spec | `apps/api/src/middleware/require-admin.authz.spec.ts` | F3 の JWT 署名・Cookie/Bearer 抽出パターン |
| 内部認証実装 | `apps/api/src/middleware/internal-auth.ts` | F3 の `x-internal-auth` ヘッダ名・401 形 |
| 既存 OG spec | `apps/og/src/__tests__/member-source.spec.ts` | F5 の `serviceFetch` スパイ |
| 既存 public fetch | `apps/web/src/lib/fetch/public.ts` | F6 の fetch 経路把握 |
| axe util | `apps/web/src/test/axe` | F1/F2 のアクセシビリティ検証 |

## 実行手順

> targeted run は **リポジトリルートからフルパス指定**する（package dir 相対パスは vitest の絶対 include glob に非マッチになる既知 pitfall）。

```bash
# F1: LoginRequiredNotice
mise exec -- pnpm --filter @ubm-hyogo/web test apps/web/src/components/auth/LoginRequiredNotice.spec.tsx
# F2: (public)/layout
mise exec -- pnpm --filter @ubm-hyogo/web test "apps/web/app/(public)/layout.spec.tsx"
# F3: require-public-access middleware
mise exec -- pnpm --filter @ubm-hyogo/api test apps/api/src/middleware/require-public-access.spec.ts
# F4: public router contract
mise exec -- pnpm --filter @ubm-hyogo/api test apps/api/src/routes/public/index.contract.spec.ts
# F5: og member-source
mise exec -- pnpm --filter @ubm-hyogo/og test apps/og/src/__tests__/member-source.spec.ts
# F6: sitemap
mise exec -- pnpm --filter @ubm-hyogo/web test apps/web/app/__tests__/sitemap.spec.ts
```

1. F1〜F6 の spec ファイルを上記 TC 定義どおりに作成・追記する。
2. 各 targeted run を実行し、**全 TC が FAIL（または実装未存在のコンパイルエラー）であること**を確認する（Red の確定）。
3. Red の根拠（どの TC がどの理由で落ちているか）を Phase 4 サブタスクにチェックする。GREEN になる TC があれば、それは「既存挙動で偶然通っている」ため期待値が緩い証拠とみなし、観測値を強化する。

## 統合テスト連携

- C1: F1（notice 単体）+ F2（layout ゲート分岐・RSC 遮断）で UI 層の認証境界を網羅。
- C2: F3（middleware 単体）+ F4（router contract）+ F5（OG header）+ F6（sitemap header）で API 層と全サーバー間消費者を網羅。
- 既存の `/profile`・`/admin/*` ゲートテスト（`require-admin.authz.spec.ts` 等）は本 Phase で変更せず、Phase 6 で GREEN 維持を回帰確認する（AC-10）。

## 多角的チェック観点（AIが判断）

- fail-closed の網羅: TC-2-6（throw）, TC-3-5（壊れ jwt）, TC-3-8（secret 未設定の内部経路）で「判定不能 → 公開しない」を 3 経路から固定。
- M-2 の明示: TC-3-8 / TC-3-9 で「INTERNAL_AUTH_SECRET 未設定時、内部経路は 401・session 経路は通る」を test で確定（Phase 7 で再確認）。
- RSC 遮断の観測可能化: TC-2-7 はデータ取得関数の呼び出し回数 0 で「事前 fetch も走らない」を機械的に検証（AC-5 の核心）。
- happy-dom pitfall 回避: F2/F6 で `vi.stubGlobal("window", ...)` を禁止し `Object.defineProperty` を採用（描画破壊回避）。

## サブタスク管理

- [ ] F1 `LoginRequiredNotice.spec.tsx` 作成（TC-1-1〜1-6）
- [ ] F2 `layout.spec.tsx` に getSession モック + TC-2-1〜2-8 追記
- [ ] F3 `require-public-access.spec.ts` 作成（TC-3-1〜3-10）
- [ ] F4 `index.contract.spec.ts` に内部認証付与更新 + TC-4-1〜4-6 追記
- [ ] F5 `member-source.spec.ts` に TC-5-1〜5-3 追記
- [ ] F6 `sitemap.spec.ts` 作成（TC-6-1〜6-3）
- [ ] 6 spec の targeted run で全 TC が Red（FAIL）であることを確認

## 成果物

| 成果物 | 配置 |
|--------|------|
| C1 notice spec | `apps/web/src/components/auth/LoginRequiredNotice.spec.tsx`（新規） |
| C1 layout spec | `apps/web/app/(public)/layout.spec.tsx`（追記） |
| C2 middleware spec | `apps/api/src/middleware/require-public-access.spec.ts`（新規） |
| C2 contract spec | `apps/api/src/routes/public/index.contract.spec.ts`（追記） |
| C2 og spec | `apps/og/src/__tests__/member-source.spec.ts`（追記） |
| C2 sitemap spec | `apps/web/app/__tests__/sitemap.spec.ts`（新規） |
| 本実行仕様 | `docs/30-workflows/completed-tasks/require-auth-public-access-gate/phase-4.md` |

## 完了条件

- [ ] 6 spec ファイルが作成・追記され、全 TC（TC-1-1〜TC-6-3）が定義されている
- [ ] 各 TC が「観測値 1 つ」と「期待値」を明記している
- [ ] 全 spec が `*.spec.{ts,tsx}` 命名である（不変条件 #8 遵守）
- [ ] 全 targeted run で Red（FAIL）が確認されている
- [ ] M-2（INTERNAL_AUTH_SECRET 未設定）を TC-3-8 / TC-3-9 で明示している

## タスク100%実行確認【必須】

- [ ] テストファイル一覧と各 TC・期待値を表で明記した
- [ ] モック方針（getSession の vi.mock / Object.defineProperty / stubGlobal 禁止）を記述した
- [ ] ルートからのフルパス targeted run コマンドを記述した
- [ ] TDD Red（全 FAIL 期待）を完了条件に含めた

## 次Phase

[phase-5.md](phase-5.md) — 実装（Green 化）
