[実装区分: 実装仕様書]

# Phase 1: 要件定義

## 目的

Issue #696 のスコープ「17 URL routes × 3 viewport = 51 screenshot baseline」と「nightly + path-filter trigger + approval gate」を実装可能な粒度で確定する。

---

## 入力

- Issue #696 本文
- `docs/30-workflows/unassigned-task/task-18-full-visual-regression-suite-001.md`
- W7 完了済み: `apps/web/playwright.config.ts` (`visual-chromium` project), `apps/web/playwright/tests/visual/*.spec.ts` 4 件
- CLAUDE.md "UI prototype alignment / MVP recovery" 19 routes 表

---

## 1. タスク分類

| 分類軸 | 値 |
|--------|-----|
| 種別 | implementation task |
| visual classification | VISUAL（51 baseline を成果物に含む） |
| implementation_mode | `new_code_addition` |
| 主成果物 | playwright config / spec / workflow / 51 baseline png |

---

## 2. 17 routes 確定リスト

task-18 W7 の 17 URL smoke 正本（public 6 / member 2 / admin 8 / not-found 1）を継承し、`/(public)/members/[id]` は固定 representative ID 1 件として **17 routes** を確定する。full visual suite は W7 smoke と同じ route 集合を画像 baseline 化する。

| # | route | layer | 認証 | 備考 |
|---|-------|-------|------|------|
| 1 | `/` | public | 不要 | top |
| 2 | `/(public)/members` | public | 不要 | 一覧 |
| 3 | `/(public)/members/[id]` | public | 不要 | fixture id=`sample-001` |
| 4 | `/(public)/register` | public | 不要 | 申込導線 |
| 5 | `/privacy` | public | 不要 | プライバシー |
| 6 | `/terms` | public | 不要 | 利用規約 |
| 7 | `/login` | auth | 不要 | 通常ステート |
| 8 | `/profile` | member | 要 | `memberLogin(context)` |
| 9 | `/(admin)/admin` | admin | 要 | `adminLogin(context)` / dashboard |
| 10 | `/(admin)/admin/members` | admin | 要 | members 管理 |
| 11 | `/(admin)/admin/tags` | admin | 要 | tags 管理 |
| 12 | `/(admin)/admin/meetings` | admin | 要 | meetings 管理 |
| 13 | `/(admin)/admin/schema` | admin | 要 | schema 管理 |
| 14 | `/(admin)/admin/requests` | admin | 要 | 申請管理 |
| 15 | `/(admin)/admin/identity-conflicts` | admin | 要 | identity conflicts |
| 16 | `/(admin)/admin/audit` | admin | 要 | audit log |
| 17 | `/__not_found_canary` | public | 不要 | W7 共通 404 route / expected status 404 |

> W7 の smoke 正本と route 集合を一致させる。login error variant のような状態差分 visual は本タスクに混ぜず、必要なら別の state-variant visual task として扱う。

---

## 3. 3 viewport 寸法

| name | width | height | 用途 |
|------|-------|--------|------|
| desktop | 1280 | 800 | ノート PC 標準 |
| tablet | 768 | 1024 | iPad portrait |
| mobile | 390 | 844 | iPhone 14 |

`deviceScaleFactor: 1` 固定、`isMobile: false`（mobile viewport でも emulation はせず viewport のみ変更）。

---

## 4. 51 baseline 命名規約

playwright デフォルトの snapshot 命名（`{spec-name}-{test-title}-{project-name}.png`）に従い、ファイル名は以下のパターン:

```
full-visual-{slugified-route}-{viewport}-visual-full-chromium-linux.png
```

例:
- `full-visual-root-desktop-visual-full-chromium-linux.png`
- `full-visual-admin-members-tablet-visual-full-chromium-linux.png`
- `full-visual-not-found-mobile-visual-full-chromium-linux.png`

slug 変換: `/` → `root`、`/(admin)/admin/members` → `admin-members`、`?error=invalid` → `-error`。

格納先: `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/`

---

## 5. `visual-full-chromium` project 仕様

`apps/web/playwright.config.ts` の `projects` 配列に **3 entry** を追加する（viewport ごとに 1 entry）。

| project name | viewport | testDir | use |
|--------------|----------|---------|-----|
| `visual-full-chromium-desktop` | 1280x800 | `playwright/tests/visual-full` | `...devices['Desktop Chrome']`, viewport override |
| `visual-full-chromium-tablet` | 768x1024 | `playwright/tests/visual-full` | viewport override |
| `visual-full-chromium-mobile` | 390x844 | `playwright/tests/visual-full` | viewport override |

`expect.toHaveScreenshot` 設定: `maxDiffPixelRatio: 0.02`（W7 継承）, `animations: 'disabled'`, `caret: 'hide'`, `scale: 'css'`。

---

## 6. 変更対象ファイル

| パス | 種別 |
|------|------|
| `apps/web/playwright.config.ts` | 編集（projects 追加 + expect.toHaveScreenshot 既定値継承） |
| `apps/web/playwright/fixtures/viewports.ts` | 新規 |
| `apps/web/playwright/fixtures/visual-routes.ts` | 新規 |
| `apps/web/playwright/tests/visual-full/full-visual.spec.ts` | 新規 |
| `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/*.png` | 新規（51 件） |
| `.github/workflows/playwright-visual-full.yml` | 新規 |
| `.github/workflows/playwright-visual-baseline-update.yml` | 新規 |
| `apps/web/package.json` | 編集（scripts 追加） |

---

## 7. 受入条件（DoD）

1. `visual-full-chromium-{desktop,tablet,mobile}` project が `apps/web/playwright.config.ts` に追加されている
2. `apps/web/playwright/tests/visual-full/full-visual.spec.ts` が 17 routes を loop し screenshot を取得する
3. `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/` 配下に 51 png が存在する
4. `.github/workflows/playwright-visual-full.yml` が nightly（`schedule: cron`）と PR path-filter で trigger される
5. `.github/workflows/playwright-visual-baseline-update.yml` が `workflow_dispatch` + `environment: visual-baseline-approval` で gate されている
6. ローカルで `pnpm --filter @ubm-hyogo/web exec playwright test --project=visual-full-chromium-desktop --project=visual-full-chromium-tablet --project=visual-full-chromium-mobile` が PASS する
7. `pnpm typecheck` / `pnpm lint` が PASS

---

## 8. スコープ out

- W7 既存 `visual-chromium` project / `playwright/tests/visual/*.spec.ts` の改修
- 17 routes smoke test の追加（task-18 W7 完了済み）
- branch protection への required check 設定変更（Phase 13 PR マージ後の別タスク）
- viewport を追加する（4 種以上）拡張

---

## 9. 不変条件再掲

CLAUDE.md UI MVP scope 不変条件 1〜4 と本ワークフロー index.md 不変条件 1〜8 を継承。

---

## 10. 成果物

- `outputs/phase-1/requirements.md`（本ファイルの確定版を出力）
