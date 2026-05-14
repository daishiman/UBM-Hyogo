# Phase 3: 設計（インターフェース / データ構造 / CI 設計）

## 目的

実装に着手するための関数シグネチャ・データ構造・CI workflow 構造・Playwright config 構造を確定する。

## 3.1 変更対象ファイル表（CONST_005 必須）

| パス | 種別 | 説明 |
| --- | --- | --- |
| `scripts/verify-design-tokens.ts` | new | 09b JSON ↔ `tokens.css` ↔ `globals.css @theme inline` の token diff スクリプト |
| `scripts/verify-design-tokens.test.ts` | new | スクリプト自身の Vitest unit test（C1〜C7） |
| `apps/web/playwright.config.ts` | edit | `smoke-chromium` / `visual-chromium` projects を追加。既存 projects は温存 |
| `apps/web/playwright/tests/full-smoke.spec.ts` | new | 17 URL routes の data-driven smoke。現行 `testDir: ./playwright/tests` に合わせる |
| `apps/web/playwright/fixtures/auth.ts` | edit | 既存 fixture に `adminLogin` / `memberLogin` helper を追加または既存機能を再利用 |
| `apps/web/playwright/tests/visual/login.spec.ts` | new | `/login` baseline |
| `apps/web/playwright/tests/visual/public-top.spec.ts` | new | `/` baseline |
| `apps/web/playwright/tests/visual/admin-dashboard.spec.ts` | new | `/admin` baseline |
| `apps/web/playwright/tests/visual/profile.spec.ts` | new | `/profile` baseline |
| `apps/web/playwright/tests/visual/__screenshots__/**` | new (gen) | baseline PNG（git tracked） |
| `.github/workflows/verify-design-tokens.yml` | new | PR + push トリガ |
| `.github/workflows/playwright-smoke.yml` | new | PR + nightly + main merge トリガ |
| `package.json` (root) | edit | `verify:tokens` script |
| `apps/web/package.json` | edit | `e2e:smoke` / `e2e:visual` / `e2e:visual:update` script |
| `apps/web/src/styles/tokens.css` | reference only | 値変更禁止 |
| `apps/web/src/styles/globals.css` | reference only | 値変更禁止 |

## 3.2 関数シグネチャ — `scripts/verify-design-tokens.ts`

```ts
export interface TokenValue {
  name: string;       // 例: "--ubm-color-accent"
  raw: string;        // 例: "oklch(0.58 0.10 55)"
  scope: string;      // 例: ":root" / "[data-theme='warm']"
}

export type DriftReason =
  | "value-mismatch"
  | "missing-in-tokens-css"
  | "missing-in-09b"
  | "missing-theme-bridge";

export interface TokenDrift {
  key: string;
  spec: TokenValue | null;
  css: TokenValue | null;
  reason: DriftReason;
}

export interface VerifyResult {
  specTokens: Map<string, TokenValue>;
  cssTokens: Map<string, TokenValue>;
  drifts: TokenDrift[];
  ok: boolean;
}

export async function verifyDesignTokens(options?: {
  specPath?: string;        // default: docs/00-getting-started-manual/specs/09b-design-tokens.md
  tokensCssPath?: string;   // default: apps/web/src/styles/tokens.css
  globalsCssPath?: string;  // default: apps/web/src/styles/globals.css
  includeThemeBridge?: boolean; // default: true
}): Promise<VerifyResult>;
```

実装方針:
- 09b は最初の fenced `json` block を抽出し、leaf の `css` / `value` pair を再帰収集
- `tokens.css` は CSS custom property 宣言（`--name: value;`）を regex 抽出
- `globals.css` の `@theme inline { ... }` ブロックは中括弧マッチで切り出し
- 値の空白を normalize（連続空白→1 個）
- diff 順序は 09b JSON の宣言順
- exit code: drift 0 件 → 0 / 1 件以上 → 1

出力フォーマット:
```
✓ design tokens in sync (N tracked)
```
または
```
✗ token drift detected (K):
  --ubm-color-accent     09b: oklch(0.58 0.10 55)   tokens.css: oklch(0.58 0.10 60)   [value-mismatch]
hint: 09b        = docs/00-getting-started-manual/specs/09b-design-tokens.md
      tokens.css = apps/web/src/styles/tokens.css
      globals    = apps/web/src/styles/globals.css (@theme inline block)
```

## 3.3 Playwright config edit（追加部分のみ）

```ts
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.PLAYWRIGHT_STAGING_BASE_URL ??
  'http://localhost:3000';

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
  // 既存 projects はそのまま残す
],
expect: { timeout: 10_000, toHaveScreenshot: { maxDiffPixelRatio: 0.02 } },
webServer: process.env.PLAYWRIGHT_BASE_URL
  ? undefined
  : [{ command: 'pnpm --filter @ubm-hyogo/web dev', url: 'http://localhost:3000', reuseExistingServer: !process.env.CI, timeout: 120_000 }],
```

## 3.4 Smoke spec データ構造

```ts
interface SmokeRoute {
  path: string;
  auth: 'public' | 'member' | 'admin';
  landmark: string[];                 // いずれか 1 件 visible なら OK
  expectRedirectTo?: RegExp;
  skip?: boolean;                     // 原則 false（CONST_007）
}
```

ROUTES 19 件は phase-01.md §確定要件 と一致させる（path / auth / landmark の組み合わせ）。

## 3.5 Auth fixture（`apps/web/playwright/fixtures/auth.ts`）

```ts
export async function adminLogin(ctx: BrowserContext): Promise<void>;
export async function memberLogin(ctx: BrowserContext): Promise<void>;
```

- Cookie 名: `authjs.session-token`
- 値: `process.env.E2E_ADMIN_SESSION_TOKEN` / `process.env.E2E_MEMBER_SESSION_TOKEN`、未注入時はローカル固定 `'e2e-{admin|member}-fixture'`
- domain: `PLAYWRIGHT_BASE_URL` の hostname、`path: /`、`httpOnly: true`、`sameSite: 'Lax'`、`secure: baseURL.protocol === 'https:'`

## 3.6 Visual spec 共通構造

各 spec は次のパターン:
1. 必要なら `adminLogin` / `memberLogin` を `beforeEach` で実行
2. `page.goto(route)` → 主要 landmark waitFor
3. `page.addStyleTag` で animation / transition / caret を停止
4. `await expect(page).toHaveScreenshot('<name>.png', { fullPage: true, maxDiffPixelRatio: 0.02 })`

## 3.7 CI 設計

### verify-design-tokens.yml
- trigger: `pull_request [main, dev]` paths filter / `push [main, dev]`
- concurrency group: `verify-design-tokens-${{ github.ref }}` / `cancel-in-progress: true`
- job 名: `verify-design-tokens`（context: `verify-design-tokens / verify-design-tokens`）
- steps: checkout → mise-action → `pnpm install --frozen-lockfile` → `pnpm verify:tokens`

### playwright-smoke.yml
- trigger: `pull_request [main, dev]` paths `apps/web/**` / `push [main]` / `schedule '0 18 * * *'` / `workflow_dispatch { base_url }`
- concurrency group: `playwright-smoke-${{ github.ref }}` / `cancel-in-progress: true`
- jobs:
  - `smoke`（job name: `smoke (chromium)`）: chromium install → `e2e:smoke` → upload `playwright-report` artifact
  - `visual`（needs: smoke、job name: `visual (chromium, 4 screens)`、`if: github.event_name != 'schedule'`）: chromium install → `e2e:visual` → 失敗時のみ `test-results` artifact upload
- env: `E2E_ADMIN_SESSION_TOKEN` / `E2E_MEMBER_SESSION_TOKEN` を `secrets.*` から注入

## 3.8 npm scripts

```jsonc
// package.json (root)
"scripts": { "verify:tokens": "tsx scripts/verify-design-tokens.ts" }

// apps/web/package.json
"scripts": {
  "e2e:smoke": "playwright test --project=smoke-chromium",
  "e2e:visual": "playwright test --project=visual-chromium",
  "e2e:visual:update": "playwright test --project=visual-chromium --update-snapshots"
}
```

## 完了条件

- [ ] §3.1 変更対象ファイル表が CONST_005 を満たす（new/edit/reference 区分明示）
- [ ] §3.2 シグネチャ確定
- [ ] §3.3-3.6 Playwright 設計確定
- [ ] §3.7 CI workflow 構造確定
- [ ] §3.8 npm scripts 確定

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## 実行タスク

- 現行 `apps/web/playwright/` 構成に合わせて実装設計と CI context を固定する。

| Task | 内容 |
| --- | --- |
| 3-A | 変更対象ファイルを現行 `apps/web/playwright/` topology に正規化する |
| 3-B | `smoke-chromium` / `visual-chromium` project の `testMatch` と evidence output を設計する |
| 3-C | branch protection required context 名を workflow/job 名から演繹する |

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Playwright config | `apps/web/playwright.config.ts` | 現行 testDir / projects |
| auth fixture | `apps/web/playwright/fixtures/auth.ts` | 既存 E2E auth helper |
| source task | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/08-regression/task-18-w7-solo-verify-tokens-and-playwright-smoke.md` | 元ファイル表 |

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| Phase 3 仕様 | `phase-03.md` | 設計・ファイル表・CI contract |

## 統合テスト連携

Phase 3 では実行しない。`testMatch` と `apps/web/playwright/tests/` 配置を合わせることで、Phase 8 の `e2e:smoke` / `e2e:visual` が空実行にならないことを設計上保証する。
