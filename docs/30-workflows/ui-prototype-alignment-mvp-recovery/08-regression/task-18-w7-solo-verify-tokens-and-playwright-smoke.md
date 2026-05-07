# task-18-verify-tokens-and-playwright-smoke

> ワークフロー: `ui-prototype-alignment-mvp-recovery`
> フェーズ: `08-regression`
> 担当: 単一実装者（solo dev）
> CONST_005 準拠（仕様書必須項目: 1. ヘッダー / 2. ゴール・非ゴール / 3. 変更対象ファイル表 / 4. スクリプト・関数シグネチャ / 5. テスト・CI flow / 6. テスト方針 / 7. ローカル実行コマンド / 8. DoD）

---

## §0. 自己完結コンテキスト

このタスクを単独 worktree / 単独 PR で着手するために必要な情報を、外部参照なしで読み切れる形で集約する。`outputs/phase-1..3` および `CLAUDE.md`、`docs/00-getting-started-manual/claude-design-prototype/styles.css`、`apps/web/playwright.config.ts`、`.github/workflows/` を必読としつつ、本セクションは要点を inline 展開する。

### §0.1 上位ゴール

`ui-prototype-alignment-mvp-recovery` ワークフロー全体の「最終 wave」として、prototype（claude-design-prototype）と本番実装（apps/web）の **token / 画面 / 導線** が一致していることを CI で機械検証する gate を確立する。具体的には (a) 19 routes の HTTP 200 + landmark + a11y を Playwright smoke で守り、(b) prototype と globals.css `@theme` の OKLch リテラル drift を verify-design-tokens で守り、(c) 4 主要画面の visual baseline を確立する。task-02..17 で投入された全成果物がこの gate を通過した時点を MVP 回帰防止の合格点とする。

### §0.2 DAG 座標

- **task-18**: 依存元 = task-02..17 の **すべて**（runtime / spec-source / design-system / public 6 / member 4 / admin 8 / regression 共通基盤）
- 依存先 = なし（最終 wave）
- 並列実行 = **不可**。全画面・全 token・全 fixture が確定していなければ smoke と visual baseline が成り立たない
- wave 位置 = wave-final（直前 wave に task-17 の regression 共通基盤が来る）

### §0.3 触れるファイル群

- 新規: `scripts/verify-design-tokens.ts` / `scripts/verify-design-tokens.test.ts` / `apps/web/tests/e2e/full-smoke.spec.ts` / `apps/web/tests/e2e/visual/{login,public-top,admin-dashboard,profile}.spec.ts` / `apps/web/tests/e2e/fixtures/auth.ts` / `.github/workflows/verify-design-tokens.yml` / `.github/workflows/playwright-smoke.yml` / `apps/web/tests/e2e/visual/__screenshots__/**`
- 編集: `apps/web/playwright.config.ts`（projects 追加） / `package.json`（root: `verify:tokens`） / `apps/web/package.json`（`e2e:smoke` / `e2e:visual` / `e2e:visual:update`） / `.github/workflows/e2e-tests.yml`（任意・職掌分離）
- 参照のみ（変更禁止）: `apps/web/app/globals.css`（task-08/09 の `@theme`） / `docs/00-getting-started-manual/claude-design-prototype/styles.css`（OKLch 正本） / `apps/api/**`

### §0.4 既存 API（不変）

- `getEnv()` / `getPublicEnv()`（task-02 で確定、`apps/web` ランタイムから利用）
- `apps/web/playwright.config.ts` の既存 `desktop-chromium` / `firefox` / `mobile-webkit` プロジェクト（温存・編集禁止、追加のみ）
- `.github/workflows/e2e-tests.yml`（functional E2E、責務分離のため重複トリガを追加しない）
- `.github/workflows/verify-indexes.yml`（命名規則 `verify-*` / `playwright-*` を踏襲する基準）
- `lefthook.yml` の hook 群（本タスクから書き換えない、CI gate のみ追加）

### §0.5 不変条件

1. `apps/api/` の本番コードに触れない（API は smoke の呼び出し対象としてのみ存在）
2. `apps/web/app/globals.css` の `@theme` 値は本タスクで変えない（drift 検知対象）
3. prototype `styles.css` を正本とする（drift があれば globals 側を直す方針）
4. 既存 Playwright project は温存し、`testMatch` で smoke / visual を完全分離する
5. solo dev ポリシー（`required_pull_request_reviews=null`）の前提を崩さず、品質保証は `required_status_checks` に追加するのみ
6. `.env` に実値を書かない／`E2E_*_SESSION_TOKEN` は GitHub Secrets / 1Password 参照のみ
7. visual baseline は ubuntu-latest（CI と同一 OS）で採取し、font hinting flaky を抑える
8. token 抽出は top-level `oklch(...)` のみ対象（`color-mix(in oklch, ...)` 入れ子は対象外）

### §0.6 上流シグネチャ（inline 展開）

- **task-02 export**: `getEnv().STAGING_BASE_URL`（`apps/web/lib/env.ts`）。Playwright の `PLAYWRIGHT_STAGING_BASE_URL` フォールバックとして利用可。
- **task-08 export**: `:root` スコープの 30+ CSS 変数の正規値。本タスクで監視対象とする 11 primitive token は以下のリテラル（prototype `styles.css` 由来）。
  - `--accent: oklch(0.58 0.10 55)` / `--accent-soft: oklch(0.95 0.04 55)` / `--accent-ink: oklch(0.20 0.05 55)`
  - `--ok: oklch(0.62 0.12 155)` / `--ok-soft: oklch(0.95 0.04 155)`
  - `--warn: oklch(0.75 0.13 85)` / `--warn-soft: oklch(0.96 0.05 85)`
  - `--danger: oklch(0.55 0.18 25)` / `--danger-soft: oklch(0.95 0.05 25)`
  - `--info: oklch(0.55 0.09 230)` / `--info-soft: oklch(0.95 0.04 230)`
  - 値の literal 一致のみ検証（contrast 等の semantic 検証は非ゴール）
- **task-09 export**: `apps/web/app/globals.css` の `@theme { ... }` ブロック構造。中括弧マッチで切り出し可能な単一ブロックとして投入される（ネストなし）。`@theme inline` 等は使わず、`@theme { ... }` のみ。verify-design-tokens は中括弧抽出 → 内部の `--name: oklch(...)` を走査する。
- **task-10 export**: 11 primitive 名と data-testid 規約。
  - primitives: `Button` / `Input` / `Label` / `Card` / `Badge` / `Tag` / `Field` / `Modal` / `Toast` / `Tabs` / `Table`
  - data-testid 規約: kebab-case、prefix は層名（`public-` / `member-` / `admin-`）、要素種別を後置（例 `admin-members-table` / `member-grid` / `login-form` / `login-state-sent` / `not-found` / `public-hero` / `admin-dashboard` / `admin-tags` / `admin-meetings` / `admin-schema` / `admin-requests` / `admin-id-conflicts` / `admin-audit`）
- **task-11..17 export**: 19 routes の path / 認可レベル / 期待主要要素 selector。
  - 公開 (unauth OK): `/` → `main h1` または `[data-testid="public-hero"]` / `/members` → `main h1` または `[data-testid="member-grid"]` / `/members/[id]` → `main h1`（fixture id `sample-001`） / `/about` → `main h1` / `/rules` → `main h1` / `/contact` → `main h1`
  - 会員 (一部 unauth / `/profile` のみ auth required): `/login` → `form[data-testid="login-form"]` / `/login?state=sent` → `[data-testid="login-state-sent"]` / `/login?state=unregistered` → `[data-testid="login-state-unregistered"]` / `/profile` → `main h1`（authenticated fixture）
  - 管理 (admin required): `/admin` → `[data-testid="admin-dashboard"]` / `/admin/members` → `[data-testid="admin-members-table"]` / `/admin/tags` → `[data-testid="admin-tags"]` / `/admin/meetings` → `[data-testid="admin-meetings"]` / `/admin/schema` → `[data-testid="admin-schema"]` / `/admin/requests` → `[data-testid="admin-requests"]` / `/admin/identity-conflicts` → `[data-testid="admin-id-conflicts"]` / `/admin/audit` → `[data-testid="admin-audit"]`
  - 共通 (unauth OK): `/__not_found_canary` → `[data-testid="not-found"]`

### §0.7 下流シグネチャ（最終 wave のため CI 上の参照ポイントのみ）

下流タスクは存在しない。代わりに本タスクが残す成果物の **CI 上での参照ポイント** を列挙する。

- **Required status checks 名**（`required_status_checks.contexts` に登録する文字列）:
  - `verify-design-tokens / verify-design-tokens`
  - `playwright-smoke / smoke (chromium)`
  - `playwright-smoke / visual (chromium, 4 screens)`
- **Baseline screenshot のリポジトリ位置**:
  - `apps/web/tests/e2e/visual/__screenshots__/login.spec.ts/login.png`
  - `apps/web/tests/e2e/visual/__screenshots__/public-top.spec.ts/public-top.png`
  - `apps/web/tests/e2e/visual/__screenshots__/admin-dashboard.spec.ts/admin-dashboard.png`
  - `apps/web/tests/e2e/visual/__screenshots__/profile.spec.ts/profile.png`
  - 採取環境は ubuntu-latest / Desktop Chrome / viewport 1280x800 で固定し、commit に含める
- **Token drift 検知の output 形式**:
  - 成功時: stdout に `✓ design tokens in sync (N tracked)` を 1 行、exit 0
  - 失敗時: stderr に `✗ token drift detected (K):` ヘッダ + token ごとに `<name> prototype: <oklch>  globals: <oklch> [<reason>]` を整列出力、`reason ∈ {value-mismatch, missing-in-globals, missing-in-prototype}`、exit 1
  - hint 行に prototype / globals のパスを明示（`docs/00-getting-started-manual/claude-design-prototype/styles.css` / `apps/web/app/globals.css`）

### §0.8 用語

- **19 routes smoke**: 本タスクが Playwright で巡回する 19 個の route 集合（公開 6 / 会員 4 / 管理 8 / 共通 1）。各 route で「HTTP < 400」「主要 landmark visible」「axe-core で `serious` / `critical` の violation 0 件」を満たすことを smoke の合格条件とする。
- **Token drift**: prototype `styles.css` の `:root` スコープにある OKLch literal と、`apps/web/app/globals.css` の `@theme` ブロック内 OKLch literal を、`TRACKED_TOKEN_NAMES`（11 primitive）に絞って比較した結果の差分。`value-mismatch` / `missing-in-globals` / `missing-in-prototype` の 3 種で分類し、いずれか 1 件でも検出された時点で `verify:tokens` を exit 1 とする。
- **Visual baseline**: `apps/web/tests/e2e/visual/__screenshots__/` 配下に commit される PNG 群。`maxDiffPixelRatio: 0.02` を上限とし、超えた場合は CI fail + diff artifact upload。意図的更新時のみ `e2e:visual:update` で再採取する。
- **Required check**: GitHub branch protection の `required_status_checks.contexts` に登録された context 名。本タスクで追加する 3 本（verify-design-tokens / smoke / visual）はマージ前に green 必須。solo dev ポリシー（review 0 人）でも CI gate により品質を担保する設計。

---

## 1. ヘッダー

| 項目 | 値 |
|------|----|
| Task ID | `task-18-verify-tokens-and-playwright-smoke` |
| 目的 | 全 19 routes の軽量回帰防止 + design token drift 検知 + 4 画面 screenshot baseline 確立 |
| 依存 (前) | `task-02` 〜 `task-17` のすべてが完了していること（runtime / spec-source / design-system / public・member・admin 全画面 / regression 共通基盤） |
| 並列実行 | **不可**（全画面の実装が確定していなければ smoke / visual baseline が無意味になるため） |
| 後続 | なし（MVP 回帰ゲートの最終タスク） |
| 想定工数 | 0.75〜1.0 人日 |
| ブランチ命名 | `feat/ui-mvp-task-18-regression-gate` |
| 影響範囲 | `apps/web/`（Playwright config / e2e tests）/ `scripts/`（verify script）/ `.github/workflows/`（CI 2 本）/ `package.json`（npm scripts） |
| 不可変 | `apps/api/` の本番コードには触らない（API は smoke の対象としてのみ呼ばれる） |
| Required Status Check 候補 | `verify-design-tokens` / `playwright-smoke (chromium)` |
| 対象 routes | phase-1 で確定した 19 routes（公開 6 / 会員 4 / 管理 8 / 共通 1） |

### 1.1 19 routes 一覧（baseURL 相対 / phase-1.md §2.2 より）

| # | 層 | route | auth |
|---|----|-------|------|
| 1 | 公開 | `/` | unauth OK |
| 2 | 公開 | `/(public)/members` | unauth OK |
| 3 | 公開 | `/(public)/members/[id]` | unauth OK（fixture id） |
| 4 | 公開 | `/about` | unauth OK |
| 5 | 公開 | `/rules` | unauth OK |
| 6 | 公開 | `/contact` | unauth OK |
| 7 | 会員 | `/login` | unauth OK |
| 8 | 会員 | `/login?state=sent` | unauth OK |
| 9 | 会員 | `/login?state=unregistered` | unauth OK |
| 10 | 会員 | `/profile` | auth required（authenticated fixture） |
| 11 | 管理 | `/(admin)/admin` | admin required |
| 12 | 管理 | `/(admin)/admin/members` | admin required |
| 13 | 管理 | `/(admin)/admin/tags` | admin required |
| 14 | 管理 | `/(admin)/admin/meetings` | admin required |
| 15 | 管理 | `/(admin)/admin/schema` | admin required |
| 16 | 管理 | `/(admin)/admin/requests` | admin required |
| 17 | 管理 | `/(admin)/admin/identity-conflicts` | admin required |
| 18 | 管理 | `/(admin)/admin/audit` | admin required |
| 19 | 共通 | `/404` (任意の存在しないパス) | unauth OK |

> Next.js App Router の route group 表記 `(public)` / `(admin)` はファイルシステム上のグルーピングであり、URL には現れない。Playwright からは `/members`、`/admin` 等で叩く。

---

## 2. ゴール / 非ゴール

### 2.1 ゴール

1. **(G1) Playwright smoke**: 19 routes すべてが
   - HTTP 200 または「期待される auth リダイレクト（login への 302/307）」を返すこと
   - 主要要素（`<main>` / route ごとの landmark heading）が visible
   - axe-core による a11y violation が `serious` / `critical` で 0 件
2. **(G2) verify-design-tokens CI**: prototype `docs/00-getting-started-manual/claude-design-prototype/styles.css` の OKLch 値（`--accent` / `--ok` / `--warn` / `--danger` / `--info` および soft / ink バリアント）と `apps/web/app/globals.css` の `@theme` ブロックの値が完全一致すること。drift があれば CI を fail。
3. **(G3) Visual regression baseline**: 4 画面（`/login` / `/` / `/admin` / `/profile`）の baseline screenshot を確立し、差分閾値（`maxDiffPixelRatio: 0.02`）で軽量検知。
4. **(G4) Required status check 設定**: PR には `verify-design-tokens` を必須化し、smoke は nightly + main merge で実行。

### 2.2 非ゴール

- **完全な Visual Regression Suite**（全 19 routes × 3 viewport の screenshot diff）は MVP 後に切り出す。本タスクは 4 画面のみ。
- **負荷試験 / パフォーマンス測定**（Lighthouse CI 等）は対象外。
- **Cross-browser matrix の網羅**（firefox / webkit）は smoke では chromium のみ必須化、firefox / webkit は nightly 任意。
- **API contract test の追加**は対象外（task-17 までで完了している前提）。
- **token に対する semantic 検証**（例: contrast ratio 計算）は対象外。値の literal 一致のみ。

---

## 3. 変更対象ファイル表

| パス | 種別 | 説明 |
|------|------|------|
| `apps/web/playwright.config.ts` | edit | `full-smoke` / `visual` プロジェクトを追加。baseURL 切替（`PLAYWRIGHT_BASE_URL` で staging / preview に切替可能）。 |
| `apps/web/tests/e2e/full-smoke.spec.ts` | new | 19 routes の status / visible / a11y を data-driven に検証。 |
| `apps/web/tests/e2e/fixtures/auth.ts` | new | `authenticatedPage` / `adminPage` fixture（既存があれば import only）。 |
| `apps/web/tests/e2e/visual/login.spec.ts` | new | `/login` の baseline screenshot |
| `apps/web/tests/e2e/visual/public-top.spec.ts` | new | `/` の baseline screenshot |
| `apps/web/tests/e2e/visual/admin-dashboard.spec.ts` | new | `/admin` の baseline screenshot |
| `apps/web/tests/e2e/visual/profile.spec.ts` | new | `/profile` の baseline screenshot |
| `apps/web/tests/e2e/visual/__screenshots__/**` | new (gen) | snapshot baseline 群（git 管理対象） |
| `scripts/verify-design-tokens.ts` | new | prototype `styles.css` と `globals.css @theme` の OKLch literal diff。 |
| `scripts/verify-design-tokens.test.ts` | new | スクリプト自身の unit test（Vitest）。 |
| `.github/workflows/verify-design-tokens.yml` | new | PR トリガで verify-design-tokens を実行。 |
| `.github/workflows/playwright-smoke.yml` | new | PR + nightly + main merge で 19 routes smoke を実行。 |
| `.github/workflows/e2e-tests.yml` | edit (任意) | 既存 e2e workflow と職掌分離。重複実行を避けるため smoke は別ファイル化。 |
| `package.json` (root) | edit | `verify:tokens` script を追加。 |
| `apps/web/package.json` | edit | `e2e:smoke` / `e2e:visual` / `e2e:visual:update` script を追加。 |
| `apps/web/app/globals.css` | reference only | task-08 / task-09 で確定した `@theme` を **読み取りのみ**。本タスクで値は変えない。 |

---

## 4. スクリプト / 関数シグネチャ

### 4.1 `scripts/verify-design-tokens.ts`

```ts
// scripts/verify-design-tokens.ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/** prototype と globals 双方で抽出する OKLch tuple */
export interface TokenValue {
  /** 例: "--accent" / "--ok-soft" */
  name: string
  /** 例: "oklch(0.58 0.10 55)" — 空白正規化後の literal */
  raw: string
  /** L (0..1), C (0..0.4), H (0..360) */
  parsed: { l: number; c: number; h: number }
  /** 出現したセレクタ（":root" / "[data-theme='warm']" 等） */
  scope: string
}

export interface VerifyResult {
  prototypeTokens: Map<string, TokenValue> // key = `${scope}::${name}`
  globalsTokens: Map<string, TokenValue>
  drifts: TokenDrift[]
  ok: boolean
}

export interface TokenDrift {
  key: string
  prototype: TokenValue | null
  globals: TokenValue | null
  reason: 'missing-in-globals' | 'missing-in-prototype' | 'value-mismatch'
}

/** 監視対象の token name 一覧（whitelist 方式。drift の本質に集中） */
export const TRACKED_TOKEN_NAMES: readonly string[] = [
  '--accent', '--accent-soft', '--accent-ink',
  '--ok', '--ok-soft',
  '--warn', '--warn-soft',
  '--danger', '--danger-soft',
  '--info', '--info-soft',
]

/** 監視対象 scope（prototype 側） */
export const TRACKED_SCOPES: readonly string[] = [':root']

/** 与えられた CSS 文字列から TRACKED_TOKEN_NAMES に該当する OKLch 宣言を抽出 */
export function extractTokens(css: string, source: 'prototype' | 'globals'): Map<string, TokenValue>

/** OKLch literal をパース。"oklch(0.58 0.10 55)" / "oklch(0.58 0.10 55 / 0.5)" 両対応 */
export function parseOklch(raw: string): { l: number; c: number; h: number; alpha?: number } | null

/** 2 つの token map を比較し drift 一覧を返す */
export function diffTokens(
  proto: Map<string, TokenValue>,
  globals: Map<string, TokenValue>,
): TokenDrift[]

/** メインエントリ。失敗時 process.exit(1) */
export async function main(args: {
  prototypePath?: string
  globalsPath?: string
  /** true なら ":root" 以外も検証（将来用） */
  includeAllScopes?: boolean
}): Promise<VerifyResult>
```

実装方針:

- 正規表現は `/--([a-z-]+)\s*:\s*oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)\s*;/g` を baseline に。
  色空間関数の入れ子（`color-mix(in oklch, ...)`）は OKLch 宣言として扱わない（top-level `oklch(...)` のみ）。
- `globals.css` の `@theme { ... }` ブロックは中括弧マッチで切り出してから token 抽出。
- diff 順序は token name の宣言順（prototype 基準）。
- 出力フォーマット:

```
✗ token drift detected (3):
  --accent           prototype: oklch(0.58 0.10 55)   globals: oklch(0.58 0.10 60)   [value-mismatch]
  --ok-soft          prototype: oklch(0.95 0.04 155)  globals: <missing>             [missing-in-globals]
  --info             prototype: <missing>             globals: oklch(0.55 0.09 230)  [missing-in-prototype]
hint: prototype = docs/00-getting-started-manual/claude-design-prototype/styles.css (正本)
      globals   = apps/web/app/globals.css (@theme block)
```

### 4.2 Playwright config — baseURL 切替

```ts
// apps/web/playwright.config.ts (抜粋)
import { defineConfig, devices } from '@playwright/test'

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.PLAYWRIGHT_STAGING_BASE_URL ??
  'http://localhost:3000'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 60_000,
  expect: { timeout: 10_000, toHaveScreenshot: { maxDiffPixelRatio: 0.02 } },
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }], ['json', { outputFile: 'playwright-report/results.json' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'smoke-chromium',
      testMatch: /full-smoke\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'visual-chromium',
      testMatch: /visual\/.*\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    // 既存の desktop-chromium / firefox / mobile-webkit はそのまま残す
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined // staging / preview を直接叩くときは local 起動しない
    : [
        {
          command: 'pnpm --filter @ubm-hyogo/web dev',
          url: 'http://localhost:3000',
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      ],
})
```

### 4.3 Smoke spec シグネチャ

```ts
// apps/web/tests/e2e/full-smoke.spec.ts (抜粋)
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { adminLogin, memberLogin } from './fixtures/auth'

interface SmokeRoute {
  path: string
  auth: 'public' | 'member' | 'admin'
  /** 主要 landmark のセレクタ。複数のうちいずれか 1 つが visible なら OK */
  landmark: string[]
  /** 200 でなく 302 redirect が期待値の場合に指定 */
  expectRedirectTo?: RegExp
  /** smoke で skip する route（fixture 整備中など） */
  skip?: boolean
}

const ROUTES: SmokeRoute[] = [
  { path: '/', auth: 'public', landmark: ['main h1', '[data-testid="public-hero"]'] },
  { path: '/members', auth: 'public', landmark: ['main h1', '[data-testid="member-grid"]'] },
  { path: '/members/sample-001', auth: 'public', landmark: ['main h1'] },
  { path: '/about', auth: 'public', landmark: ['main h1'] },
  { path: '/rules', auth: 'public', landmark: ['main h1'] },
  { path: '/contact', auth: 'public', landmark: ['main h1'] },
  { path: '/login', auth: 'public', landmark: ['form[data-testid="login-form"]'] },
  { path: '/login?state=sent', auth: 'public', landmark: ['[data-testid="login-state-sent"]'] },
  { path: '/login?state=unregistered', auth: 'public', landmark: ['[data-testid="login-state-unregistered"]'] },
  { path: '/profile', auth: 'member', landmark: ['main h1'] },
  { path: '/admin', auth: 'admin', landmark: ['[data-testid="admin-dashboard"]'] },
  { path: '/admin/members', auth: 'admin', landmark: ['[data-testid="admin-members-table"]'] },
  { path: '/admin/tags', auth: 'admin', landmark: ['[data-testid="admin-tags"]'] },
  { path: '/admin/meetings', auth: 'admin', landmark: ['[data-testid="admin-meetings"]'] },
  { path: '/admin/schema', auth: 'admin', landmark: ['[data-testid="admin-schema"]'] },
  { path: '/admin/requests', auth: 'admin', landmark: ['[data-testid="admin-requests"]'] },
  { path: '/admin/identity-conflicts', auth: 'admin', landmark: ['[data-testid="admin-id-conflicts"]'] },
  { path: '/admin/audit', auth: 'admin', landmark: ['[data-testid="admin-audit"]'] },
  { path: '/__not_found_canary', auth: 'public', landmark: ['[data-testid="not-found"]'] },
]

for (const route of ROUTES) {
  test.describe(`smoke: ${route.path} (${route.auth})`, () => {
    test.skip(!!route.skip, 'fixture 未整備')

    test('returns 200 + landmark visible + a11y clean', async ({ page, context }) => {
      if (route.auth === 'admin') await adminLogin(context)
      if (route.auth === 'member') await memberLogin(context)

      const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' })
      expect(response, `no response for ${route.path}`).not.toBeNull()
      expect(response!.status(), `${route.path} status`).toBeLessThan(400)

      const visible = await Promise.any(
        route.landmark.map((sel) => page.locator(sel).first().waitFor({ state: 'visible', timeout: 10_000 })),
      )
      expect(visible).toBeUndefined() // waitFor は void を resolve するので存在のみ確認

      const a11y = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .disableRules(['color-contrast']) // token 検証は別タスクで担保
        .analyze()
      const blocking = a11y.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))
      expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([])
    })
  })
}
```

### 4.4 Visual spec シグネチャ（4 画面共通）

```ts
// apps/web/tests/e2e/visual/login.spec.ts
import { test, expect } from '@playwright/test'

test('login baseline', async ({ page }) => {
  await page.goto('/login')
  await page.locator('form[data-testid="login-form"]').waitFor({ state: 'visible' })
  // animation を止める
  await page.addStyleTag({ content: `*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }` })
  await expect(page).toHaveScreenshot('login.png', { fullPage: true, maxDiffPixelRatio: 0.02 })
})
```

`/` / `/admin` / `/profile` も同型。`/admin` / `/profile` は `adminLogin` / `memberLogin` を beforeEach で呼ぶ。

### 4.5 Auth fixture

```ts
// apps/web/tests/e2e/fixtures/auth.ts
import type { BrowserContext } from '@playwright/test'

/** E2E 専用の test session cookie を注入する。
 *  実装は task-17 までで確立済みの "test-session" provider を流用する。
 */
export async function adminLogin(ctx: BrowserContext): Promise<void> {
  await ctx.addCookies([
    {
      name: 'authjs.session-token',
      value: process.env.E2E_ADMIN_SESSION_TOKEN ?? 'e2e-admin-fixture',
      domain: new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000').hostname,
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      secure: false,
    },
  ])
}

export async function memberLogin(ctx: BrowserContext): Promise<void> {
  await ctx.addCookies([
    {
      name: 'authjs.session-token',
      value: process.env.E2E_MEMBER_SESSION_TOKEN ?? 'e2e-member-fixture',
      domain: new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000').hostname,
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      secure: false,
    },
  ])
}
```

---

## 5. テスト / CI flow

### 5.1 `.github/workflows/verify-design-tokens.yml`

```yaml
name: verify-design-tokens

on:
  pull_request:
    branches: [main, dev]
    paths:
      - 'apps/web/app/globals.css'
      - 'docs/00-getting-started-manual/claude-design-prototype/styles.css'
      - 'scripts/verify-design-tokens.ts'
      - '.github/workflows/verify-design-tokens.yml'
  push:
    branches: [main, dev]

concurrency:
  group: verify-design-tokens-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    name: verify-design-tokens
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - uses: jdx/mise-action@v2
      - name: Install deps
        run: mise exec -- pnpm install --frozen-lockfile
      - name: Run verify-design-tokens
        run: mise exec -- pnpm verify:tokens
```

### 5.2 `.github/workflows/playwright-smoke.yml`

```yaml
name: playwright-smoke

on:
  pull_request:
    branches: [main, dev]
    paths:
      - 'apps/web/**'
      - '.github/workflows/playwright-smoke.yml'
  push:
    branches: [main]
  schedule:
    - cron: '0 18 * * *' # JST 03:00 nightly
  workflow_dispatch:
    inputs:
      base_url:
        description: 'External baseURL (staging / preview)'
        required: false

concurrency:
  group: playwright-smoke-${{ github.ref }}
  cancel-in-progress: true

jobs:
  smoke:
    name: smoke (chromium)
    runs-on: ubuntu-latest
    timeout-minutes: 20
    env:
      PLAYWRIGHT_BASE_URL: ${{ inputs.base_url || '' }}
      E2E_ADMIN_SESSION_TOKEN: ${{ secrets.E2E_ADMIN_SESSION_TOKEN }}
      E2E_MEMBER_SESSION_TOKEN: ${{ secrets.E2E_MEMBER_SESSION_TOKEN }}
    steps:
      - uses: actions/checkout@v4
      - uses: jdx/mise-action@v2
      - run: mise exec -- pnpm install --frozen-lockfile
      - run: mise exec -- pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium
      - name: Run smoke
        run: mise exec -- pnpm --filter @ubm-hyogo/web e2e:smoke
      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-smoke-report
          path: apps/web/playwright-report
          retention-days: 14

  visual:
    name: visual (chromium, 4 screens)
    runs-on: ubuntu-latest
    timeout-minutes: 15
    needs: smoke
    if: github.event_name != 'schedule'
    env:
      E2E_ADMIN_SESSION_TOKEN: ${{ secrets.E2E_ADMIN_SESSION_TOKEN }}
      E2E_MEMBER_SESSION_TOKEN: ${{ secrets.E2E_MEMBER_SESSION_TOKEN }}
    steps:
      - uses: actions/checkout@v4
      - uses: jdx/mise-action@v2
      - run: mise exec -- pnpm install --frozen-lockfile
      - run: mise exec -- pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium
      - run: mise exec -- pnpm --filter @ubm-hyogo/web e2e:visual
      - if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: visual-diff
          path: apps/web/test-results
          retention-days: 14
```

### 5.3 PR / merge / nightly のフロー

```
[PR open]
   ├─ verify-design-tokens     ← required check
   ├─ playwright-smoke (smoke) ← required check
   └─ playwright-smoke (visual)← required check（4 screens）

[main merge]
   ├─ playwright-smoke (smoke / visual) を再実行（regression catch）

[nightly 03:00 JST]
   └─ playwright-smoke (smoke のみ) を staging baseURL に対して実行
        └─ workflow_dispatch で base_url 指定可能
```

### 5.4 Required status check 設定（GitHub branch protection）

solo dev ポリシー（`required_pull_request_reviews=null`）の前提下で、以下を `required_status_checks.contexts` に追加する:

- `verify-design-tokens / verify-design-tokens`
- `playwright-smoke / smoke (chromium)`
- `playwright-smoke / visual (chromium, 4 screens)`

設定検証コマンド:

```bash
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  | jq '.required_status_checks.contexts'
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  | jq '.required_status_checks.contexts'
```

---

## 6. テスト方針（このタスク自体のテスト）

本タスクは「回帰防止 gate を作る」タスクなので、**gate 自身が機能していること**を二重に検証する。

### 6.1 verify-design-tokens の self-test

`scripts/verify-design-tokens.test.ts`（Vitest）で以下のケースを担保:

| ケース | 入力 | 期待 |
|--------|------|------|
| C1: 完全一致 | prototype と globals が同値 | `ok: true` / drifts.length === 0 / exit 0 |
| C2: 値ミスマッチ | globals 側 `--accent` を `oklch(0.99 0 0)` に書換 | `ok: false` / `value-mismatch` 1 件 / exit 1 |
| C3: globals 側欠落 | globals から `--ok-soft` を削除 | `missing-in-globals` 1 件 / exit 1 |
| C4: prototype 側欠落 | prototype から `--info` 削除（temp file で検証） | `missing-in-prototype` 1 件 / exit 1 |
| C5: 空白正規化 | `oklch(0.58  0.10  55)` (double space) と `oklch(0.58 0.10 55)` | drift 0（normalize 済み） |
| C6: ネスト無視 | `color-mix(in oklch, var(--accent) 12%, transparent)` を含む宣言 | OKLch literal として扱わない |
| C7: スコープ外無視 | `[data-theme="warm"]` 内の `--accent` | `:root` のみ対象なので drift 検出されない |

実行: `mise exec -- pnpm vitest run scripts/verify-design-tokens.test.ts`

### 6.2 Playwright smoke の self-test（落ちる/通る両ケース）

| ケース | 仕掛け | 期待 |
|--------|--------|------|
| S1: 全 route 200 | 開発サーバ立ち上げ後 `pnpm --filter @ubm-hyogo/web e2e:smoke` | 19 route 全 PASS |
| S2: 1 route だけ 500 を返す | テスト用 route handler で `/admin/audit` を一時的に throw | smoke が 1 件 fail し、CI が exit 1 |
| S3: a11y violation 注入 | `/login` の `<input>` から `<label>` を一時削除 | a11y check が serious で fail |
| S4: landmark 欠落 | `/profile` の `<main>` を一時削除 | landmark waitFor が timeout fail |
| S5: redirect 期待 | 未認証で `/profile` 訪問 | `expectRedirectTo: /login` が満たされる（`auth: 'member'` フィクスチャ未注入時） |

S2〜S4 は手動検証（PR レビュー時に「壊して通るか」を 1 回実行）。

### 6.3 Visual diff の self-test

| ケース | 仕掛け | 期待 |
|--------|--------|------|
| V1: baseline 確立 | 初回実行 (`e2e:visual:update`) | 4 png が `__screenshots__/` に作成、commit に含まれる |
| V2: 微小差分 | 文言の typo 修正レベル（< 2% pixel） | PASS（`maxDiffPixelRatio: 0.02`） |
| V3: 大規模 layout 変更 | `/admin` のレイアウト改変 | FAIL し diff artifact がアップロードされる |

---

## 7. ローカル実行コマンド

```bash
# 依存インストール
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium

# token drift 検証
mise exec -- pnpm verify:tokens

# verify script 自身の unit test
mise exec -- pnpm vitest run scripts/verify-design-tokens.test.ts

# 19 routes smoke（local dev server を Playwright が起動）
mise exec -- pnpm --filter @ubm-hyogo/web e2e:smoke

# staging に対して smoke
PLAYWRIGHT_BASE_URL=https://staging.ubm-hyogo.example \
  mise exec -- pnpm --filter @ubm-hyogo/web e2e:smoke

# 4 画面 visual baseline 確認
mise exec -- pnpm --filter @ubm-hyogo/web e2e:visual

# baseline 更新（意図的なデザイン変更時のみ）
mise exec -- pnpm --filter @ubm-hyogo/web e2e:visual:update

# レポート参照
open apps/web/playwright-report/index.html
```

`package.json` 側 script:

```jsonc
// package.json (root, 抜粋)
{
  "scripts": {
    "verify:tokens": "tsx scripts/verify-design-tokens.ts"
  }
}
```

```jsonc
// apps/web/package.json (抜粋)
{
  "scripts": {
    "e2e:smoke": "playwright test --project=smoke-chromium",
    "e2e:visual": "playwright test --project=visual-chromium",
    "e2e:visual:update": "playwright test --project=visual-chromium --update-snapshots"
  }
}
```

---

## 8. DoD（Definition of Done）

### 8.1 コード成果物

- [ ] `scripts/verify-design-tokens.ts` が実装され、`pnpm verify:tokens` が exit 0（drift なし）
- [ ] `scripts/verify-design-tokens.test.ts` の 7 ケース（C1〜C7）が PASS
- [ ] `apps/web/playwright.config.ts` に `smoke-chromium` / `visual-chromium` プロジェクトが追加
- [ ] `apps/web/tests/e2e/full-smoke.spec.ts` が 19 routes（skip 0 件）すべて PASS
- [ ] `apps/web/tests/e2e/visual/{login,public-top,admin-dashboard,profile}.spec.ts` が baseline 確立済み
- [ ] `apps/web/tests/e2e/visual/__screenshots__/` に 4 画像が commit されている
- [ ] `apps/web/tests/e2e/fixtures/auth.ts` の `adminLogin` / `memberLogin` が動作

### 8.2 CI 成果物

- [ ] `.github/workflows/verify-design-tokens.yml` が PR で green
- [ ] `.github/workflows/playwright-smoke.yml` の `smoke (chromium)` job が PR で green
- [ ] `playwright-smoke` の `visual (chromium, 4 screens)` job が PR で green
- [ ] nightly schedule（`0 18 * * *` UTC = JST 03:00）が設定済み
- [ ] main / dev branch protection の `required_status_checks.contexts` に
      `verify-design-tokens / verify-design-tokens` および
      `playwright-smoke / smoke (chromium)` および
      `playwright-smoke / visual (chromium, 4 screens)` が登録されている
      （`gh api repos/daishiman/UBM-Hyogo/branches/main/protection | jq '.required_status_checks.contexts'` で確認）

### 8.3 ドキュメント / 運用

- [ ] 本仕様書（`docs/30-workflows/ui-prototype-alignment-mvp-recovery/08-regression/task-18-verify-tokens-and-playwright-smoke.md`）がコミット済み
- [ ] `package.json` / `apps/web/package.json` に `verify:tokens` / `e2e:smoke` / `e2e:visual` / `e2e:visual:update` の 4 script が追加
- [ ] `E2E_ADMIN_SESSION_TOKEN` / `E2E_MEMBER_SESSION_TOKEN` が GitHub Secrets に登録済み（値はローカル `.env` には書かない、1Password 参照）
- [ ] README または `docs/00-getting-started-manual/` のいずれか 1 箇所から本仕様へのリンクが張られている

### 8.4 検証コマンド（DoD 自動チェック）

PR レビュー前に以下をすべて green にする:

```bash
mise exec -- pnpm install --frozen-lockfile
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens
mise exec -- pnpm vitest run scripts/verify-design-tokens.test.ts
mise exec -- pnpm --filter @ubm-hyogo/web e2e:smoke
mise exec -- pnpm --filter @ubm-hyogo/web e2e:visual
```

すべて exit 0 で完了し、PR の required status checks 3 本（verify-design-tokens / smoke / visual）が green になった時点で task-18 を完了とする。

---

## 付録 A. 例外運用

| 状況 | 運用 |
|------|------|
| prototype 側を意図的に更新する場合 | 1) prototype `styles.css` を更新 → 2) globals 側 `@theme` を同値に更新 → 3) `pnpm verify:tokens` で drift 0 を確認 → 4) 1 PR にまとめる |
| visual diff が意図的な UI 変更で fail | `pnpm --filter @ubm-hyogo/web e2e:visual:update` を実行し baseline を更新、PR に screenshot 差分を含める |
| smoke が staging 通信タイムアウト | nightly job は `retries: 2` 済み。連続 2 回失敗時のみ Slack 通知（既存 `notify-completion.sh` ルートに統合）。 |
| token 検証スクリプトが false-positive | `TRACKED_TOKEN_NAMES` から一時除外し、Issue で根拠を残す（whitelist 方式の利点） |

## 付録 B. 既存ファイル / 既存 workflow との関係

- 既存 `.github/workflows/e2e-tests.yml` は **フル E2E（functional）** を扱う。本タスクで追加する `playwright-smoke.yml` は **軽量 smoke + visual baseline 専用** で、責務を分離する。重複実行を避けるため、smoke から functional へのトリガは行わない。
- 既存 `apps/web/playwright.config.ts` の `desktop-chromium` / `mobile-webkit` プロジェクトはそのまま温存。`smoke-chromium` / `visual-chromium` は `testMatch` で完全分離する。
- 既存 `.github/workflows/verify-indexes.yml` と命名規則を揃えるため、新 workflow も `verify-*` / `playwright-*` のプレフィックスで統一。

## 付録 C. リスクと対策

| リスク | 影響 | 対策 |
|--------|------|------|
| visual baseline が flaky（font hinting / sub-pixel） | PR が誤って fail | `maxDiffPixelRatio: 0.02` + animation 停止 + 同一 OS（ubuntu-latest）で baseline 採取 |
| 19 routes 増殖で smoke が肥大化 | CI 時間悪化 | `fullyParallel: true` + workers 2 で 5 分以内を目安。超過したら `testMatch` で分割。 |
| token 抽出 regex の取りこぼし | drift 検知漏れ | unit test C5 / C6 / C7 で代表ケースを固定、追加 token は `TRACKED_TOKEN_NAMES` に明示追加するルール |
| auth fixture が prod に漏れる | セキュリティ事故 | `E2E_*_SESSION_TOKEN` は staging / preview の専用 short-lived token のみ許可、prod では使えない値域に固定 |
