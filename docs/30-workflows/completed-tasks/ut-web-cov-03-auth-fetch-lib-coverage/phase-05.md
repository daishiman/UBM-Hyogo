# Phase 5: 実装ランブック — ut-web-cov-03-auth-fetch-lib-coverage

[実装区分: 実装仕様書]

> 当タスクは当初 `docs-only` として起票されたが、目的（apps/web の auth/fetch lib coverage を Stmts/Lines/Funcs ≥85%, Branches ≥80% に引き上げる）を達成するには Vitest テストファイル（7 本）と test-utils helper の **新規作成が必須** である。CONST_004（実態優先）に従い `taskType` を `implementation` に補正し、本仕様書を実装ランブックとして扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-03-auth-fetch-lib-coverage |
| phase | 5 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| 改訂日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

apps/web の auth / fetch / session / me-types lib 群（合計 7 ファイル）に対する Vitest unit test を、依存少 → 依存多の順で段階的に追加し、各ステップで coverage と既存テストの regression が無いことを確認しながら進める。

## 実行タスク

1. 着手順序を決定する（依存少 → 依存多、後述 7 ステップ）。
2. 各ステップで必要な mock setup の雛形を確定する。
3. 共通 helper（`apps/web/src/test-utils/fetch-mock.ts`）の API を Phase 8 と整合させる。
4. PR 分割方針を確定する（1 タスク = 1 PR、base = `dev`）。
5. `vitest.config.ts` の coverage exclude に type-only ファイルを追加する。

## 参照資料

- 起票根拠: 2026-05-01 実測 apps/web coverage（lines=39.39%）
- docs/00-getting-started-manual/specs/02-auth.md
- docs/00-getting-started-manual/specs/13-mvp-auth.md
- docs/30-workflows/ut-web-cov-03-auth-fetch-lib-coverage/phase-02.md（error 列）
- docs/30-workflows/ut-web-cov-03-auth-fetch-lib-coverage/phase-04.md（依存マトリクス）

## 変更対象ファイル一覧

### 新規作成（テスト）

| # | ファイル | 対応プロダクションコード | 概要 |
|---|---|---|---|
| 1 | `apps/web/src/lib/api/me-types.test-d.ts` | `me-types.ts` (39L) | 型のみ round-trip 検証（任意） |
| 2 | `apps/web/src/lib/auth/oauth-client.test.ts` | `oauth-client.ts` (19L) | `signInWithGoogle` redirect sanitize |
| 3 | `apps/web/src/lib/auth/magic-link-client.test.ts` | `magic-link-client.ts` (55L) | `sendMagicLink` / `MagicLinkRequestError` / `isLoginGateState` |
| 4 | `apps/web/src/lib/session.test.ts` | `session.ts` (25L) | `getSession` happy/null/missing-fields |
| 5 | `apps/web/src/lib/fetch/public.test.ts` | `fetch/public.ts` (102L) | service-binding / fetch 二経路、404/500 |
| 6 | `apps/web/src/lib/fetch/authed.test.ts` | `fetch/authed.ts` (73L) | cookie 転送、401→AuthRequiredError、非2xx→FetchAuthedError |
| 7 | `apps/web/src/lib/auth.test.ts` | `auth.ts` (391L) | fetchSessionResolve / buildAuthConfig / signIn・jwt・session callbacks |

### 新規作成（helper）

- `apps/web/src/test-utils/fetch-mock.ts` — Phase 8 で抽出する fetch / cloudflare context mock の集約。

### 設定変更

- root `vitest.config.ts`（または monorepo ルート vitest config）の `coverage.exclude` に `apps/web/src/lib/api/me-types.ts` を追加。

## 着手順序と各ステップの詳細

### Step 1: `me-types.test-d.ts`

- 依存: なし（type only）
- 対象シグネチャ:
  - `export type Me = { ... }`
  - `export type MeResponse = { me: Me } | { me: null }`
- 期待ケース数: 4 以上（happy / null / partial / extra-field）
- mock setup: なし
- 完了確認:
  ```bash
  mise exec -- pnpm --filter web vitest run apps/web/src/lib/api/me-types.test-d.ts
  ```

### Step 2: `oauth-client.test.ts`

- 依存: `next-auth/react` を `vi.mock` で stub
- 対象シグネチャ: `export async function signInWithGoogle(redirect?: string): Promise<void>`
- 期待ケース数: 5 以上（undefined / "/profile" 既定 / "//evil.com" 拒否 / "https://evil.com" 拒否 / 正常 path）
- mock 雛形:
  ```ts
  import { vi } from "vitest";
  const signInMock = vi.fn().mockResolvedValue(undefined);
  vi.mock("next-auth/react", () => ({ signIn: (...args: unknown[]) => signInMock(...args) }));
  ```
- 完了確認:
  ```bash
  mise exec -- pnpm --filter web vitest run apps/web/src/lib/auth/oauth-client.test.ts
  ```

### Step 3: `magic-link-client.test.ts`

- 依存: global `fetch` のみ
- 対象シグネチャ:
  - `export async function sendMagicLink(email: string): Promise<{ state: LoginGateState }>`
  - `export class MagicLinkRequestError extends Error`
  - `export function isLoginGateState(v: unknown): v is LoginGateState`
- 期待ケース数: 8 以上（202+state ok / 202+json reject / 4xx → throw / text reject fallback / state enum 外 → "sent" fallback / isLoginGateState true / false / 非 string）
- mock 雛形:
  ```ts
  import { vi } from "vitest";
  const fetchSpy = vi.spyOn(globalThis, "fetch");
  beforeEach(() => fetchSpy.mockReset());
  fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({ state: "sent" }), { status: 202 }));
  ```
- 完了確認:
  ```bash
  mise exec -- pnpm --filter web vitest run apps/web/src/lib/auth/magic-link-client.test.ts
  ```

### Step 4: `session.test.ts`

- 依存: `auth.ts` の `getAuth` を `vi.mock`
- 対象シグネチャ: `export async function getSession(): Promise<SessionUser | null>`
- 期待ケース数: 5 以上（happy / session=null / user=undefined / memberId 欠損 / email 欠損）
- mock 雛形:
  ```ts
  vi.mock("@/lib/auth", () => ({
    getAuth: vi.fn().mockResolvedValue({
      auth: vi.fn().mockResolvedValue({ user: { memberId: "m1", email: "a@b.c" } }),
    }),
  }));
  ```
- 完了確認:
  ```bash
  mise exec -- pnpm --filter web vitest run apps/web/src/lib/session.test.ts
  ```

### Step 5: `fetch/public.test.ts`

- 依存: `@opennextjs/cloudflare` の `getCloudflareContext` を `vi.mock`、global fetch
- 対象シグネチャ:
  - `export async function fetchPublic<T>(path: string, init?: RequestInit & { revalidate?: number }): Promise<T>`
  - `export async function fetchPublicOrNotFound<T>(path: string, init?: ...): Promise<T>`
  - `export class FetchPublicNotFoundError extends Error`
- 期待ケース数: 10 以上（service-binding 経路 200 / fetch 経路 200 / 404→FetchPublicNotFoundError (orNotFound) / 404→throw (Public) / 500→throw / revalidate 反映 / binding 無し+PUBLIC_API_BASE_URL 使用 / 両方無し→throw or fallback）
- mock 雛形:
  ```ts
  vi.mock("@opennextjs/cloudflare", () => ({
    getCloudflareContext: vi.fn(() => ({ env: { API_SERVICE: { fetch: vi.fn() } } })),
  }));
  ```
- 完了確認:
  ```bash
  mise exec -- pnpm --filter web vitest run apps/web/src/lib/fetch/public.test.ts
  ```

### Step 6: `fetch/authed.test.ts`

- 依存: `next/headers` の `cookies()` を `vi.mock`、global fetch
- 対象シグネチャ:
  - `export async function fetchAuthed<T>(path: string, init?: RequestInit): Promise<T>`
  - `export class AuthRequiredError extends Error`
  - `export class FetchAuthedError extends Error { constructor(status, bodyText) }`
- 期待ケース数: 10 以上（path "/" 始まらない→throw / 200 happy + cookie header 確認 / 401→AuthRequiredError / 403→FetchAuthedError + bodyText / 500→FetchAuthedError / text() reject → bodyText="" / cookies() 空 → cookie 未設定 / INTERNAL_API_BASE_URL のみ / PUBLIC のみ / 両方なし→fallback http://127.0.0.1:8787）
- mock 雛形:
  ```ts
  vi.mock("next/headers", () => ({
    cookies: vi.fn(async () => ({
      getAll: () => [{ name: "authjs.session-token", value: "x" }],
    })),
  }));
  ```
- 完了確認:
  ```bash
  mise exec -- pnpm --filter web vitest run apps/web/src/lib/fetch/authed.test.ts
  ```

### Step 7: `auth.test.ts`

- 依存: `next-auth`, `@auth/core/providers/google`, `@auth/core/providers/credentials`, `next-auth/jwt`, global fetch
- 対象シグネチャ:
  - `async function fetchSessionResolve(input): Promise<{ memberId, role, reason } | null>`
  - `function buildAuthConfig(): NextAuthConfig`
  - `signIn` / `jwt` / `session` callbacks
  - `export async function getAuth(): Promise<NextAuthResult>`（lazy loader）
- 期待ケース数: 25 以上（fetchSessionResolve 6 / providers 2 / signIn callback 6 / jwt 5 / session 3 / getAuth 3）
- mock 雛形:
  ```ts
  vi.mock("next-auth", () => ({ default: vi.fn(() => ({ auth: vi.fn(), handlers: {} })) }));
  vi.mock("@auth/core/providers/google", () => ({ default: vi.fn((opts) => ({ id: "google", ...opts })) }));
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ memberId: "m1", role: "member" }), { status: 200 })
  );
  ```
- 完了確認:
  ```bash
  mise exec -- pnpm --filter web vitest run apps/web/src/lib/auth.test.ts
  ```

## 共通 helper 採用方針

`apps/web/src/test-utils/fetch-mock.ts` に以下を集約（Phase 8 で本実装）:

```ts
export function mockFetchOnce(status: number, body: unknown, init?: ResponseInit): MockInstance;
export function mockFetchSequence(responses: Array<{ status: number; body: unknown }>): void;
export function mockFetchNetworkError(): void;
export function restoreFetch(): void;
export function mockCloudflareContext(env?: Partial<CloudflareEnv>): void;
```

DRY 化判定基準: 同一 mock パターンが **3 ファイル以上** で再利用される場合のみ抽出。それ以外は inline。詳細は Phase 8 を参照。

## ローカル実行コマンド

```bash
# 個別ファイル
mise exec -- pnpm --filter web vitest run apps/web/src/lib/<対象>.test.ts

# 全体 + coverage
mise exec -- pnpm --filter web test:coverage

# 型・lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## PR 分割方針

- 1 タスク = 1 PR。base = `dev`。
- 含める変更: 7 test ファイル + helper + vitest.config exclude 1 行。
- プロダクションコード変更なし（破壊的変更なし）。

## 実行手順

- 対象 directory: docs/30-workflows/ut-web-cov-03-auth-fetch-lib-coverage/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は本 Phase の Step 1 → Step 7 順に従い、各 step 完了確認コマンドで緑を確認してから次へ進む。

## 統合テスト連携

- 上流: 05a-authjs-google-oauth-admin-gate, 05b-B-magic-link-callback-credentials-provider
- 関連 quality gate: 06b-A-me-api-authjs-session-resolver; release readiness handoff: 09b-A-observability-sentry-slack-runtime-smoke

## 多角的チェック観点

- #2 responseId/memberId separation（auth.ts session callback で memberId を確実に注入）
- #5 public/member/admin boundary（fetchPublic / fetchAuthed を混同しない）
- #6 apps/web D1 direct access forbidden（fetch wrapper 経由のみ）
- 未実装/未実測を PASS と扱わない。
- placeholder と実測 evidence を分離する。

## サブタスク管理

- [ ] Step 1-7 の着手順序が依存少→依存多になっていることを確認
- [ ] 各 step の mock 雛形がプロダクションコードのシグネチャと整合
- [ ] vitest.config.ts の coverage.exclude 変更を確認
- [ ] outputs/phase-05/main.md を作成する

## 成果物

- outputs/phase-05/main.md（実装ランブック手順表）

## 完了条件 (DoD)

- 7 test ファイル + helper が新規作成され、各々 `vitest run` 単体で緑。
- `pnpm --filter web test:coverage` で全対象 Stmts/Lines/Funcs ≥85% / Branches ≥80%。
- auth client は happy / token-missing / token-invalid / network-fail の 4 ケース以上を含む。
- fetch wrapper は 200 / 401 / 403 / 5xx / network-fail を網羅。
- me-types は type-d round-trip。
- 既存 web test に regression なし。

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] CONST_005 必須項目（変更対象ファイル・関数シグネチャ・入出力・テスト方針・実行コマンド・DoD）を具体化済み
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 6 へ、Step 1-7 の着手順序、helper API 案、各ファイルの観測点を渡す。
