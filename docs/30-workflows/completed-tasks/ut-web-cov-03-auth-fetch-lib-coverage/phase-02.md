# Phase 2: 設計 — ut-web-cov-03-auth-fetch-lib-coverage

[実装区分: 実装仕様書]

> 本タスクはユーザー指定 `taskType=docs-only` に対し、Vitest テストファイル新規作成が必須のため、CONST_004 実態優先原則に基づき実装仕様書として作成する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-03-auth-fetch-lib-coverage |
| phase | 2 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| 改訂日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

対象 7 ファイルそれぞれにテストケース表（happy / null-or-empty / error / auth-fail / network-fail）を作成し、mock 戦略と test helper 配置を確定する。

## 実行タスク

1. 対象ファイル別のテストケース表を作成する。
2. mock 戦略を確定する（`vi.mock` / `vi.fn` / `vi.stubEnv` / DI）。
3. test helper の新規配置（`apps/web/src/test-utils/fetch-mock.ts`）を確定する。

## 関数シグネチャ（CONST_005）

実装ファイルから引用する現行シグネチャ（変更しない）:

```ts
// apps/web/src/lib/auth.ts
export async function fetchSessionResolve(
  fetchImpl: typeof fetch,
  baseUrl: string,
  email: string,
): Promise<SessionResolveResult>;
export function buildAuthConfig(deps: AuthConfigDeps): NextAuthConfig;
export async function getAuth(): Promise<{ auth: ...; signIn: ...; signOut: ...; handlers: ... }>;

// apps/web/src/lib/auth/magic-link-client.ts
export async function sendMagicLink(email: string, redirect?: string): Promise<void>;
export class MagicLinkRequestError extends Error { state?: LoginGateState; status: number }
export function isLoginGateState(value: unknown): value is LoginGateState;

// apps/web/src/lib/auth/oauth-client.ts
export async function signInWithGoogle(redirect?: string): Promise<void>;

// apps/web/src/lib/session.ts
export async function getSession(): Promise<SessionUser | null>;

// apps/web/src/lib/fetch/authed.ts
export async function fetchAuthed<T>(path: string, init?: RequestInit): Promise<T>;
export class AuthRequiredError extends Error {}
export class FetchAuthedError extends Error { status: number }

// apps/web/src/lib/fetch/public.ts
export async function fetchPublic<T>(path: string, init?: RequestInit): Promise<T>;
export async function fetchPublicOrNotFound<T>(path: string, init?: RequestInit): Promise<T>;
```

## テストケース表

### 1. `apps/web/src/lib/auth.ts` → `auth.test.ts`

| test ID | 種別 | 入力 / 条件 | 期待出力 / 副作用 |
| --- | --- | --- | --- |
| AUTH-001 | happy | `fetchSessionResolve(fetchImpl=200,{user})` | `{ ok: true, user }` を返す |
| AUTH-002 | token-missing | response 200 ＋ `user=null` | `{ ok: false, reason: "no-user" }` |
| AUTH-003 | token-invalid | response 401 | `{ ok: false, reason: "unauthorized" }` |
| AUTH-004 | network-fail | `fetchImpl` reject | `{ ok: false, reason: "network" }` |
| AUTH-005 | happy | `buildAuthConfig` providers DI | google + credentials の 2 provider が並ぶ |
| AUTH-006 | callback signIn | admin allowed email | `true` を返す |
| AUTH-007 | callback signIn | admin domain mismatch | `false` を返す |
| AUTH-008 | callback jwt | first sign-in | token に user.email / role が乗る |
| AUTH-009 | callback session | token → session | `session.user.role` が token と一致 |
| AUTH-010 | getAuth lazy | 2 回呼び出し | NextAuth は 1 度だけ初期化される |

### 2. `apps/web/src/lib/auth/magic-link-client.ts` → `magic-link-client.test.ts`

| test ID | 種別 | 入力 / 条件 | 期待出力 / 副作用 |
| --- | --- | --- | --- |
| ML-001 | happy | fetch 200 | resolve、POST `/api/auth/magic-link` body に email/redirect |
| ML-002 | error | fetch 400 + state JSON | `MagicLinkRequestError`（state 付き） throw |
| ML-003 | error | fetch 500 plain | `MagicLinkRequestError`（state undefined） throw |
| ML-004 | network-fail | fetch reject | `MagicLinkRequestError`（status=0 / network） throw |
| ML-005 | predicate | `isLoginGateState({state:"sent"})` | `true` |
| ML-006 | predicate | `isLoginGateState(null)` / `{}` | `false` |

### 3. `apps/web/src/lib/auth/oauth-client.ts` → `oauth-client.test.ts`

| test ID | 種別 | 入力 / 条件 | 期待出力 / 副作用 |
| --- | --- | --- | --- |
| OA-001 | happy | `signInWithGoogle()` | `signIn("google", { callbackUrl: "/" })` 呼び出し |
| OA-002 | happy | `signInWithGoogle("/me")` | `callbackUrl: "/me"` |
| OA-003 | error | `signIn` reject | error が throw される（再 throw） |

### 4. `apps/web/src/lib/session.ts` → `session.test.ts`

| test ID | 種別 | 入力 / 条件 | 期待出力 / 副作用 |
| --- | --- | --- | --- |
| SES-001 | happy | `auth()` resolves `{ user }` | `SessionUser` を返す |
| SES-002 | null | `auth()` resolves `null` | `null` を返す |
| SES-003 | error | `auth()` reject | `null` を返すか throw（実装に従う） |

### 5. `apps/web/src/lib/fetch/authed.ts` → `authed.test.ts`

| test ID | 種別 | 入力 / 条件 | 期待出力 / 副作用 |
| --- | --- | --- | --- |
| FA-001 | happy 200 | fetch 200 JSON | parse 後 T を返す。Cookie ヘッダ転送される |
| FA-002 | auth-fail 401 | fetch 401 | `AuthRequiredError` throw |
| FA-003 | error 403 | fetch 403 | `FetchAuthedError(status=403)` throw |
| FA-004 | error 5xx | fetch 500 | `FetchAuthedError(status=500)` throw |
| FA-005 | network-fail | fetch reject | `FetchAuthedError`（network） throw |
| FA-006 | edge | response.json() throw | `FetchAuthedError` throw |

### 6. `apps/web/src/lib/fetch/public.ts` → `public.test.ts`

| test ID | 種別 | 入力 / 条件 | 期待出力 / 副作用 |
| --- | --- | --- | --- |
| FP-001 | happy SB | service-binding 経由 200 | T を返す（getCloudflareContext mock） |
| FP-002 | happy fetch | service-binding 不在 → 通常 fetch 200 | T を返す |
| FP-003 | 404 | `fetchPublicOrNotFound` 404 | `FetchPublicNotFoundError` を throw |
| FP-004 | 404 | `fetchPublic` 404 | error throw |
| FP-005 | error 5xx | 500 | error throw |
| FP-006 | network-fail | fetch reject | error throw |

### 7. `apps/web/src/lib/api/me-types.ts` → 取り扱い

- 型のみのファイル。Phase 4 で除外 or `*.test-d.ts` で round-trip を意思決定する論点として記載。

## mock 戦略

| 対象 | 戦略 |
| --- | --- |
| `auth.ts` | `fetchImpl` / `providerFactories` の DI を `vi.fn` で注入。`getCloudflareContext` は `vi.mock("@opennextjs/cloudflare")` で stub。`process.env` は `vi.stubEnv`。 |
| `magic-link-client.ts` | `globalThis.fetch` を `vi.fn` 化（共通 helper `fetch-mock.ts` 経由）。`Response` は標準オブジェクトを直接生成。 |
| `oauth-client.ts` | `vi.mock("next-auth/react", () => ({ signIn: vi.fn() }))` |
| `session.ts` | `vi.mock("./auth", () => ({ getAuth: vi.fn(() => ({ auth: vi.fn() })) }))` |
| `fetch/authed.ts` | `vi.mock("next/headers", () => ({ cookies: vi.fn(() => ({ toString: () => "k=v" })) }))` ＋ global fetch mock |
| `fetch/public.ts` | `vi.mock("@opennextjs/cloudflare", () => ({ getCloudflareContext: vi.fn() }))` ＋ global fetch mock |

## test helper

- 新規作成: `apps/web/src/test-utils/fetch-mock.ts`
  - `installFetchMock()` / `mockJsonResponse(status, body)` / `mockNetworkError()` の 3 関数を export。
  - 各 test の `beforeEach` で `vi.stubGlobal("fetch", ...)` を行う。
  - Phase 8 の DRY 化で抽出されたものを共通利用する想定。
- 既存 fixture 再利用: 現時点で apps/web に共通 helper はないため、本タスクで初めて作成する。

## 入出力・副作用定義（CONST_005）

各テストケース表の「入力 / 条件」「期待出力 / 副作用」列に 1 行ずつ記載済み。共通副作用は次の通り:

- fetch mock を呼び出すこと自体（呼び出し回数・引数の assertion）。
- `signIn` / `auth` / `cookies` 等 mock の呼び出し検証。
- console.error は出さない（test 内で `vi.spyOn(console, "error")` し未呼び出しを assert）。

## 変更対象ファイル一覧（Phase 2 確定版）

- 新規 test 6 ファイル（Phase 1 列挙どおり）。
- 新規 helper: `apps/web/src/test-utils/fetch-mock.ts`。
- 既存実装の変更: なし。

## 参照資料

- 起票根拠: 2026-05-01 実測 apps/web coverage（lines=39.39%）
- `docs/00-getting-started-manual/specs/02-auth.md`
- `docs/00-getting-started-manual/specs/13-mvp-auth.md`
- 既存 test pattern 参考: `apps/web/src/lib/**/*.test.ts`（co-located 配置）

## 実行手順

- 対象 directory: `docs/30-workflows/ut-web-cov-03-auth-fetch-lib-coverage/`
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。
- ローカル実行コマンド: `mise exec -- pnpm --filter web test:coverage`

## 統合テスト連携

- 上流: 05a-authjs-google-oauth-admin-gate, 05b-B-magic-link-callback-credentials-provider
- 関連 quality gate: 06b-A-me-api-authjs-session-resolver; release readiness handoff: 09b-A-observability-sentry-slack-runtime-smoke

## 多角的チェック観点

- #2 responseId/memberId separation
- #5 public/member/admin boundary
- #6 apps/web D1 direct access forbidden（fetch wrapper 経由のみ／test 内でも mock fetch のみ使用、D1 binding mock は禁止）
- 未実装/未実測を PASS と扱わない。
- placeholder と実測 evidence を分離する。

## サブタスク管理

- [ ] 7 ファイル別テストケース表を作成する
- [ ] mock 戦略表を確定する
- [ ] `fetch-mock.ts` helper の API を確定する
- [ ] outputs/phase-02/main.md を作成する

## 成果物

- `outputs/phase-02/main.md`

## 完了条件

- 全対象 Stmts/Lines/Funcs ≥85% / Branches ≥80%（最終 Phase での目標）
- auth client は happy / token-missing / token-invalid / network-fail の 4 ケース
- fetch wrapper は 200 / 401 / 403 / 5xx / network-fail を網羅
- me-types は zod or type predicate の round-trip
- 既存 web test に regression なし
- 本 Phase では テストケース表 / mock 戦略 / helper 配置が確定していれば DoD を満たす。

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 3 へ以下を渡す: テストケース表 7 件、mock 戦略表、test helper API、変更対象ファイル一覧、関数シグネチャ。
