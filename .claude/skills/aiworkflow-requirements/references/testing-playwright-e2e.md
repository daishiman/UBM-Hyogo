# Playwright E2Eテスト仕様

> 本ドキュメントは統合システム設計仕様書の一部です。
> 管理: .claude/skills/aiworkflow-requirements/
>
> **親ドキュメント**: [quality-e2e-testing.md](./quality-e2e-testing.md)

## 変更履歴

| Version | Date       | Changes                                      |
| ------- | ---------- | -------------------------------------------- |
| 1.2.0   | 2026-03-31 | UT-UIUX-PLAYWRIGHT-E2E-001: `ui-ux-layer1` / `ui-ux-layer2`、`TEST_TARGETS` 駆動、baseline 正本パス `layer2-visual.spec.ts-snapshots/`、implicit role / positive tabindex ルール、Phase 11 screenshot 導線を反映 |
| 1.2.1   | 2026-04-30 | 08b UBM-Hyogo web Playwright scaffold を反映。`scaffolding-only` / `VISUAL_DEFERRED` では skipped spec・placeholder evidence を CI green / visual PASS と扱わず、full-execution task で実 screenshot / axe / D1 seed / auth fixture を閉じる |
| 1.1.0   | 2026-03-01 | UT-IMP-PHASE11-WORKTREE-PROTOCOL-001: Playwright設定のCI/ローカル動的切替（timeout/expect/retries/workers/reporter）を反映。`ci.yml` の `e2e-desktop` ジョブ（xvfb + chromium + artifact保存）を追記 |
| 1.0.0   | 2026-02-02 | 初版作成（TASK-8C-D E2Eテスト実装を基に抽出） |

---

## 概要

PlaywrightによるE2Eテストの実装パターンを定義する。Electron Rendererプロセスを対象とし、ViteのDevサーバー経由で実行する。CIでは `CI=true` を前提に、タイムアウト・リトライ・ワーカー数・レポーターを動的に切り替える。

### UBM-Hyogo Web scaffold 境界（08b）

`docs/30-workflows/08b-parallel-playwright-e2e-and-ui-acceptance-smoke/` は web app 向け Playwright scaffold の current task。状態は `scaffolding-only` / `workflow_state: spec_created` / `visualEvidence: VISUAL_DEFERRED`。

この状態では次を PASS と扱わない:

- `test.describe.skip` の spec が存在するだけの状態
- `outputs/phase-11/evidence/` の README / SCREENSHOT_LIST / placeholder `axe-report.json`
- `workflow_dispatch` の manual workflow yml

full-execution へ昇格する条件:

- Auth.js 互換 fixture または UI login helper が実装済み
- local/staging D1 seed/reset が決定論的に実行可能
- screenshot PNG が 30 枚以上保存済み
- Playwright HTML/JSON report と real `axe-report.json` が保存済み
- PR / push CI gate は skipped spec なしで green

### UBM-Hyogo Web full execution 仕様（08b-A）

`docs/30-workflows/completed-tasks/08b-A-playwright-e2e-full-execution/` は 08b scaffold を実行可能な gate に昇格するための current execution workflow。状態は `spec_created` / `implementation-spec` / `VISUAL_ON_EXECUTION` / `Phase 1-10 and 12 completed` / `Phase 11 contract_ready_runtime_pending` / `Phase 13 pending_user_approval`。

この workflow の Phase 12 は spec completeness を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` として閉じる。実 Playwright 実行、desktop/mobile screenshot、real axe report、Playwright HTML/JSON report、PR/push CI gate promotion は Phase 11 runtime cycle でのみ fresh evidence にできる。

必須 evidence manifest は `docs/30-workflows/completed-tasks/08b-A-playwright-e2e-full-execution/outputs/phase-11/evidence-manifest.md`。非 admin `/admin/*` UI gate、direct `/api/admin/*` API gate、admin session による他人本文編集 403 は別ファイルで保存し、UI redirect だけを admin authorization PASS と扱わない。desktop/mobile screenshot は合計 30 枚以上を最低ラインにする。

---

## テスト構成

### ディレクトリ構造

| パス                           | 役割                            |
| ------------------------------ | ------------------------------- |
| `apps/desktop/e2e/`            | E2Eテストファイル配置           |
| `apps/desktop/e2e/ui-ux/`      | UI/UX 3層評価テスト配置         |
| `apps/desktop/e2e/*.spec.ts`   | Playwrightテストスイート        |
| `apps/desktop/e2e/ui-ux/layer2-visual.spec.ts-snapshots/` | Visual baseline 正本 |
| `apps/desktop/playwright.config.ts` | Playwright設定ファイル    |

### テストフレームワーク

| 項目           | 値                    |
| -------------- | --------------------- |
| フレームワーク | Playwright Test       |
| パッケージ     | `@playwright/test`    |
| 実行方法       | Vite DevServer経由    |
| ベースURL      | `http://localhost:5173` |
| CI統合         | `ci.yml` の `e2e-desktop` ジョブ（xvfb + chromium） |

---

## セレクター戦略

### 優先順位

| 優先度 | セレクター種別    | 例                                    | 用途                   |
| ------ | ----------------- | ------------------------------------- | ---------------------- |
| 1      | ARIA Role         | `getByRole('button', {name: '許可'})` | アクセシビリティ重視   |
| 2      | data-testid       | `[data-testid="chat-input"]`          | 安定したテスト用ID     |
| 3      | aria-label        | `[aria-label="スキルを選択"]`         | ラベル付きコンポーネント |
| 4      | Text Content      | `getByText('権限の確認が必要です')`   | ユーザー視点のテスト   |
| 5      | CSS Selector      | `.permission-dialog`                  | 最終手段               |

### セレクター定数パターン

```typescript
const SELECTORS = {
  /** チャット入力欄 */
  chatInput: '[data-testid="chat-input"]',

  /** スキルセレクター */
  skillSelector: '[aria-label="スキルを選択"]',

  /** ダイアログコンテナ（ARIA） */
  dialogContainer: '[role="alertdialog"]',
} as const;
```

**設計原則**:
- `as const`で型安全性を確保
- JSDocコメントで用途を明記
- ARIA属性を優先（アクセシビリティテストと兼用）

---

## 待機戦略

### 推奨パターン

| パターン                      | 用途                       | 例                                           |
| ----------------------------- | -------------------------- | -------------------------------------------- |
| `waitForSelector`             | 要素の出現/消失待機        | `await page.waitForSelector('text="タイトル"')` |
| `expect().toBeVisible()`      | アサーション内待機         | `await expect(dialog).toBeVisible()`         |
| `waitForLoadState`            | ページ状態変化             | `await page.waitForLoadState('networkidle')` |
| `waitForSelector({ state })`  | 要素消失待機               | `{ state: 'hidden' }`                        |

### 避けるべきパターン

| パターン              | 問題点                       | 代替策                         |
| --------------------- | ---------------------------- | ------------------------------ |
| `waitForTimeout(ms)`  | フレーキー、非決定論的       | イベントベース待機に置換       |
| 固定時間スリープ      | 環境依存、CI不安定           | 状態変化を検知して待機         |
| ハードコード遅延      | テスト時間の無駄             | `waitForSelector`や`expect`利用 |

### 状態遷移待機パターン

```typescript
// ダイアログが閉じるまで待機
await page.waitForSelector(`text="${DIALOG_TITLE_TEXT}"`, {
  state: "hidden",
});

// ロード完了まで待機
await page.waitForLoadState("networkidle");

// 要素が表示されるまで待機（タイムアウト付き）
await expect(page.getByText("実行中")).toBeVisible({ timeout: 5000 });
```

---

## ヘルパー関数パターン

### 基本構造

```typescript
/**
 * [操作内容]を実行する
 * @param page - Playwrightのページオブジェクト
 * @param [パラメータ名] - [パラメータ説明]
 */
async function [functionName](page: Page, param?: Type): Promise<void> {
  // 実装
}
```

### 標準ヘルパー一覧

| ヘルパー名                | 機能                           |
| ------------------------- | ------------------------------ |
| `selectSkill`             | スキルをドロップダウンから選択 |
| `triggerPermissionDialog` | 権限ダイアログをトリガー       |
| `waitForPermissionDialog` | ダイアログ表示を待機           |
| `approvePermission`       | 権限を許可                     |
| `denyPermission`          | 権限を拒否                     |
| `checkRememberChoice`     | 選択記憶チェックボックスをON   |

### ヘルパー実装例

```typescript
async function selectSkill(page: Page, skillName: string): Promise<void> {
  await page.click(SELECTORS.skillSelector);
  await page.getByRole("option", { name: skillName }).click();
  // Note: waitForTimeoutは非推奨、状態変化待機に置換推奨
}

async function approvePermission(page: Page): Promise<void> {
  await page.getByRole("button", { name: APPROVE_BUTTON_TEXT }).click();
  await page.waitForSelector(`text="${DIALOG_TITLE_TEXT}"`, {
    state: "hidden",
  });
}
```

---

## テストスイート構造

### ファイル構造テンプレート

```typescript
/**
 * @file [feature].spec.ts
 * @description [機能名] E2Eテスト
 * @task [TASK-ID]
 */

import { test, expect, type Page } from "@playwright/test";

// ===== テストデータ定数 =====
const TEST_DATA = { ... };

// ===== セレクター定数 =====
const SELECTORS = { ... };

// ===== ヘルパー関数 =====
async function helperFunction(page: Page): Promise<void> { ... }

// ===== テストスイート =====
test.describe("[機能名] E2E テスト", () => {
  test.beforeEach(async ({ page }) => {
    // セットアップ
  });

  test.describe("TC-N: [テスト名]", () => {
    test("[期待動作]", async ({ page }) => {
      // Arrange, Act, Assert
    });
  });
});
```

### テストカテゴリ分類

| カテゴリ         | 命名規則                  | 内容                         |
| ---------------- | ------------------------- | ---------------------------- |
| Basic Flow       | TC-1〜TC-N                | 基本的なユーザーフロー       |
| Edge Cases       | Edge Cases: [説明]        | 境界値・例外的なシナリオ     |
| Error Handling   | Error Handling: [説明]    | エラー時の動作               |
| Accessibility    | Accessibility: [説明]     | WCAG準拠・キーボード操作     |

---

## アクセシビリティテスト

### 検証項目

| 項目                   | 検証方法                                  |
| ---------------------- | ----------------------------------------- |
| ARIA role              | `[role="alertdialog"]`の存在確認          |
| aria-modal             | `toHaveAttribute("aria-modal", "true")`   |
| キーボードナビゲーション | Tab/Enter/Escapeキー操作                 |
| フォーカストラップ     | Tab連打でダイアログ内に留まることを確認   |

### UI/UX Layer 1 / Layer 2 追加ルール

- `TEST_TARGETS` を single source of truth にする
- native `button` / `textarea` / text `input` は explicit role がなくても implicit role を PASS 扱いにする
- `tabindex="0"` を多用する roving tabindex パターンは fail 条件にしない。重複検知は positive tabindex のみに適用する
- Phase 11 screenshot 証跡は workflow 配下 `outputs/phase-11/screenshots/` に保存する

### ダイアログ固有パターン

```typescript
// ARIA属性検証
await expect(dialog).toHaveAttribute("aria-modal", "true");

// Escapeキー動作
await page.keyboard.press("Escape");
await expect(dialog).not.toBeVisible();

// フォーカス＋Enterキー操作
await page.getByRole("button", { name: "許可" }).focus();
await page.keyboard.press("Enter");
```

---

## beforeEachパターン

### 標準セットアップ

```typescript
test.beforeEach(async ({ page }) => {
  // 1. アプリケーションルートに移動
  await page.goto("/");

  // 2. ページロード完了待機
  await page.waitForLoadState("networkidle");

  // 3. 対象画面への遷移
  const chatNav = page.getByRole("navigation", { name: "Main navigation" });
  await chatNav.getByRole("button").nth(1).click();

  // 4. 画面ロード確認
  await page.waitForSelector('[data-testid="chat-view"]', { timeout: 10000 });

  // 5. 前提条件設定（スキル選択等）
  await selectSkill(page, TEST_SKILL_NAME);
});
```

---

## テストスキップパターン

### 条件付きスキップ

```typescript
// 環境依存でスキップ
test.skip("タイムアウトテスト", async ({ page }) => {
  // Note: モック設定が必要なためスキップ
});

// 条件付き実行
test.skip(process.env.CI === 'true', 'CI環境ではスキップ');
```

---

## 機能別 evidence spec

### Attendance paging UI evidence（parallel-04 / 2026-05-15）

`apps/web/playwright/tests/attendance-paging-ui-evidence.spec.ts` は `AttendanceList` cursor paging の VISUAL evidence を 1 ケースで取得する focused spec。SSR `/me/profile` の initial 50 件と CSR `/api/me/attendance?cursor=<opaque>` の追加 page を **dual-endpoint mock** で同期 seed する。

| 項目 | 値 |
| --- | --- |
| fixture | `mockApi.setAttendancePage({ profile, page })`（`apps/web/playwright/fixtures/auth.ts:441`） |
| 取得対象 | `/me/profile`（initial 50 件 + `attendanceMeta.{ hasMore, nextCursor }`）と `/me/attendance?cursor=...`（追加 records） |
| evidence env | `PLAYWRIGHT_ATTENDANCE_PAGING_EVIDENCE=1`、`PLAYWRIGHT_EVIDENCE_DIR`、`ATTENDANCE_PAGING_SCREENSHOT_DIR` |
| screenshot | `outputs/phase-11/screenshots/profile-attendance-paging-desktop.png`（desktop-chromium） |
| 対象セレクタ | `getByRole('button', { name: 'もっと見る' })`、`getByText('定例会 51')` |
| 関連 lessons | `references/lessons-learned-parallel-04-attendance-paging-ui-2026-05.md` L-P04-003 dual-endpoint mock |

実行コマンド:

```bash
PLAYWRIGHT_ATTENDANCE_PAGING_EVIDENCE=1 \
  PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/parallel-04-attendance-paging-ui/outputs/phase-11/evidence \
  ATTENDANCE_PAGING_SCREENSHOT_DIR=../../docs/30-workflows/completed-tasks/parallel-04-attendance-paging-ui/outputs/phase-11/screenshots \
  mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  playwright/tests/attendance-paging-ui-evidence.spec.ts --project=desktop-chromium
```

`page.route()` は SSR fetch を intercept できないため、SSR endpoint と CSR endpoint を 1 fixture method で同期 seed する設計が必須。

---

## CI/CD統合

### GitHub Actions設定例

| 設定項目       | 推奨値                |
| -------------- | --------------------- |
| headless       | `true`                |
| timeout        | `60000`（CI） / `30000`（local） |
| retries        | `2`（CI環境のみ）     |
| workers        | `1`（並列競合防止）   |
| reporter       | `github + html`（CI） |

### `e2e-desktop` ジョブ標準構成（2026-03-01）

| ステップ | 内容 |
| --- | --- |
| 1 | `pnpm install --frozen-lockfile` |
| 2 | `actions/download-artifact@v4` で `shared-build` を取得 |
| 3 | `actions/cache@v4` で `~/.cache/ms-playwright` をキャッシュ |
| 4 | `pnpm --filter @repo/desktop exec playwright install --with-deps chromium` |
| 5 | `pnpm --filter @repo/desktop build` |
| 6 | `xvfb-run --auto-servernum pnpm --filter @repo/desktop exec playwright test` |
| 7 | `apps/desktop/playwright-report/` をartifact保存（7日） |

### playwright.config.ts推奨設定

```typescript
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  timeout: isCI ? 60_000 : 30_000,
  expect: { timeout: isCI ? 10_000 : 5_000 },
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npx vite --config vite.e2e.config.ts',
    url: 'http://localhost:5173',
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
```

---

## デバッグパターン

### Headed Mode実行

```bash
pnpm --filter @repo/desktop exec playwright test --headed
```

### 特定テスト実行

```bash
pnpm --filter @repo/desktop exec playwright test e2e/skill-permission.spec.ts
```

### トレース取得

```bash
pnpm --filter @repo/desktop exec playwright test --trace on
```

---

## Server Component fetch 観測パターン（E2E Stage 3b / 2026-05-10）

Next.js App Router の Server Component が SSR フェーズで実行する server-side `fetch()` は **Playwright `page.route()` で intercept できない**。browser-context の HTTP を intercept する `page.route()` は SSR fetch の対象外。`apps/web` の `/`, `/(public)/members`, `/(public)/members/[id]` などは SSR fetch で API を呼ぶため、E2E で deterministic に動かすには別経路の mock が必要。

| 戦略 | 内容 |
| --- | --- |
| deterministic mock API | `scripts/e2e-mock-api.mjs` を CI で起動し `http://127.0.0.1:8787` で待受 |
| env 注入 | `INTERNAL_API_BASE_URL=http://127.0.0.1:8787` と `PUBLIC_API_BASE_URL=http://127.0.0.1:8787` を CI job env に設定 |
| fetch helper の HTTP fallback 優先 | `apps/web/src/lib/fetch/public.ts` は `PUBLIC_API_BASE_URL` 明示時、Cloudflare service binding より HTTP fallback を優先する |
| grep gate | ローカル限定エンドポイント（`127.0.0.1:8787` 等）の `apps/web/src` 配下への焼き込みを task-18 regression smoke の grep gate で禁止 |

CI 設定例（`.github/workflows/e2e-tests.yml`）:

```yaml
env:
  INTERNAL_API_BASE_URL: http://127.0.0.1:8787
  PUBLIC_API_BASE_URL: http://127.0.0.1:8787
  PLAYWRIGHT_EVIDENCE_DIR: playwright/evidence
steps:
  - name: Start deterministic mock API
    run: node scripts/e2e-mock-api.mjs &
  - name: Wait for mock API
    run: curl --retry 10 --retry-delay 1 --retry-connrefused http://127.0.0.1:8787/health
  - name: Run e2e
    run: pnpm --filter @ubm-hyogo/web e2e
```

詳細は次を参照:

- canonical workflow: `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate/`
- 関連 lessons: `lessons-learned/lessons-learned-e2e-stage3b-server-component-mock-api-2026-05.md`
- `apps/web/src/lib/fetch/public.ts`: HTTP fallback 優先ロジック
- `scripts/e2e-mock-api.mjs`: CI hard gate 用 deterministic mock API
- `scripts/coverage-gate-e2e.sh`: line coverage 80% gate（`THRESHOLD_FIXTURE` で fixture override 可能）

## task-18 W7: 17 URL routes smoke + 4 screen visual baseline + design token verifier（2026-05-12）

`docs/30-workflows/task-18-w7-verify-tokens-and-playwright-smoke/` で確定した MVP regression gate。

| 項目 | 内容 |
| --- | --- |
| Smoke spec | `apps/web/playwright/tests/full-smoke.spec.ts`（17 URL routes: public 6 / member 2 / admin 8 / not-found 1） |
| Visual specs | `apps/web/playwright/tests/visual/*.spec.ts`（`/login` / `/` / `/admin` / `/profile` の 4 screen baseline） |
| Token verifier | `scripts/verify-design-tokens.ts`（`09b-design-tokens.md` §9 / `apps/web/src/styles/tokens.css` / `apps/web/src/styles/globals.css @theme inline` の 3 層 bridge drift gate） |
| Fixture | `apps/web/playwright/fixtures/auth.ts`（`serviceWorkers: "block"` 必須） |
| Web server | `apps/web/playwright.config.ts` で `next dev --webpack` を固定（Turbopack 禁止：OpenNext Workers bundle と非互換） |
| SSR fixture | `apps/web/src/lib/admin/server-fetch.ts` に `PLAYWRIGHT_TASK18_ADMIN_FIXTURE` env-gated branch（`NODE_ENV !== "production"` で active） |
| 実行 script | `pnpm verify:tokens` / `pnpm --filter @ubm-hyogo/web e2e:smoke` / `e2e:visual` |
| CI workflows | `.github/workflows/verify-design-tokens.yml` / `.github/workflows/playwright-smoke.yml` |
| Evidence | tracked `.txt` / `.json` のみ canonical（`.log` は `.gitignore` 対象） |
| Visual baseline 更新 | `--update-snapshots` は user-gated。`apps/web/playwright/tests/visual/<spec>-snapshots/` に tracked |
| Required check 候補 | `verify-design-tokens / verify-design-tokens` / `playwright-smoke / smoke (chromium)` / `playwright-smoke / visual (chromium, 4 screens)` |

詳細: `references/workflow-task-18-w7-verify-tokens-and-playwright-smoke-artifact-inventory.md` /
`references/lessons-learned-task-18-w7-verify-tokens-and-playwright-smoke-2026-05.md`

拡張は `docs/30-workflows/unassigned-task/task-18-full-visual-regression-suite-001.md`（17 URL routes × 3 viewport の full baseline）で扱う。

### 2026-05-14 sync-after fix: Turbopack 回避 / project testIgnore 拡張 / a11y contrast

`e2e-tests-coverage-gate`（dev required check）と `verify-indexes-up-to-date` の round-2 修復で得た追加 lesson:

- **Playwright webServer は `next dev --webpack` 固定**: Next.js 16 `next dev` は Turbopack 既定で、長時間 webServer + pnpm symlinked `node_modules` 配下では `[project]/.../next/dist/server/route-modules/app-route/vendored/contexts/app-router-context.js` の resolve が間欠的に失敗し、`/members` 等が 60s ハング → 18min job timeout になる。`apps/web/package.json` に `"dev:webpack": "next dev --webpack"` を追加し、`apps/web/playwright.config.ts` の webServer command を `pnpm --filter @ubm-hyogo/web dev:webpack` に切替える。CLAUDE.md の `apps/web` production build webpack 不変条件と整合。L-TASK18-W7-013。
- **`Project.testIgnore` は global testIgnore を merge せず置換**: `desktop-chromium` / `desktop-firefox` / `mobile-webkit` の project entry に書く `testIgnore` は top-level `testIgnore` を上書きする。fixture-gated spec（`admin-identity-conflicts.spec.ts` 等）が 3 project に leak しないよう、各 project entry で `...fixtureGatedTestIgnore` を spread し `visual/` + `full-smoke/` regex と並べる。L-TASK18-W7-012。
- **`BasePage.visit()` で router prefetch を settle**: 連続 `page.goto()` の前に `await this.page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {})` を挟むと in-flight client navigation との race を減らせる。
- **mobile-webkit から admin-pages.spec.ts を除外**: `iPhone 13` emulation の `hasTouch + isMobile` device flag は Next router prefetch と 5 連続 `/admin/*` goto を race させ "Navigation interrupted by another navigation" を発生させる。settle を入れても reproducible のため、admin UI は desktop-primary scope と割り切り `mobile-webkit.testIgnore` に `/admin-pages\.spec\.ts$/` を追加。
- **a11y AA contrast: `--ubm-color-accent` は L≤0.52 oklch**: `oklch(0.58 0.10 55)` だと `panel: #ffffff` 上で 4.5:1 を割り `e2e-tests-coverage-gate` 内の axe が `color-contrast` violation で fail する。3-layer bridge（spec §3.2 / §3.4.1 / JSON snippet と `tokens.css`）すべて `oklch(0.52 0.10 55)` に揃え、`pnpm verify:tokens` で drift を担保する。L-TASK18-W7-011。

### 2026-05-13 sync-after fix: URL fallback と project testIgnore

CI 初回 run で得た sync-after lesson:

- **`PLAYWRIGHT_BASE_URL` の fallback は `||`**: `apps/web/playwright.config.ts:52` と `apps/web/playwright/fixtures/auth.ts:399` で `process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'` を使う。`??` だと空文字 (CI env passthrough) が valid 扱いになり `new URL('')` で全 spec 転倒する。
- **project レベル testIgnore で visual/full-smoke を chromium-linux に閉じ込め**: `desktop-chromium` / `desktop-firefox` / `mobile-webkit` project に `testIgnore: [/visual\/.*\.spec\.ts$/, /full-smoke\.spec\.ts$/]` を入れ、`smoke-chromium` / `visual-chromium` project に `testMatch` で対象を絞る。firefox/webkit に baseline PNG が無いまま実行すると `A snapshot doesn't exist` で fail し、smoke の二重実行で workers=1 が長時間ブロックされる。
- **Visual baseline の初期 commit 経路**: 初回は `--update-snapshots` ローカル生成ではなく、CI で 1 度 fail させて `playwright-visual-artifacts/*-actual.png` を `gh run download` し、`apps/web/playwright/tests/visual/<spec>.spec.ts-snapshots/<name>-visual-chromium-linux.png` にリネームコピーして tracked 化する。chromium-linux 環境差を排除できる。

## 関連ドキュメント

| ドキュメント                                         | 内容                   |
| ---------------------------------------------------- | ---------------------- |
| [quality-e2e-testing.md](./quality-e2e-testing.md)   | E2Eテスト全体仕様      |
| [testing-accessibility.md](./testing-accessibility.md) | アクセシビリティ仕様 |
| [testing-fixtures.md](./testing-fixtures.md)         | テストフィクスチャ仕様 |
| [deployment-gha.md](./deployment-gha.md)             | CIでのE2E実行要件      |
| [branch-protection.md](./branch-protection.md)       | branch-specific drift rule（Stage 3c）/ task-18 required check 候補 |
