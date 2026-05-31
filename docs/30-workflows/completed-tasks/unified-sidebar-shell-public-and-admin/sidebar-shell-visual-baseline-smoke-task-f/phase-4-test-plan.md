---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 4
phase_name: テスト計画
created_at: 2026-05-29
---

# Phase 4: テスト計画

[実装区分: 実装仕様書]

## 1. smoke ケース表（S1〜S6）

`apps/web/playwright/tests/sidebar-shell/sidebar-shell-smoke.spec.ts` に以下 6 ケースを実装する。
fixture は `apps/web/playwright/fixtures/auth.ts` の拡張 `test`（`anonymousPage` / `memberPage` / `adminPage` + `mockApi`）のみを使用し、新規 storageState を作らない（AC-8）。
viewport は smoke spec 内で `page.setViewportSize(...)` により切り替える（S4/S6=375×812、S5=1024×800、S1〜S3 は project 既定の 1280×800）。

| # | fixture | viewport | 操作 | アサーション | 期待値 |
|---|---------|----------|------|--------------|--------|
| S1 | `anonymousPage` | desktop 1280×800 | `goto('/')` → `waitShellReady(page)` | `[data-testid="shell-sidebar"]` 内に PUBLIC group のみ。「ログイン」リンク visible。MEMBERS / ADMIN group は不在 | PUBLIC nav item 3 件 / `getByRole('link', { name: 'ログイン' })` visible / MEMBERS・ADMIN テキスト 0 件 |
| S2 | `memberPage` | desktop 1280×800 | `goto('/profile')` → `waitShellReady` → user menu を `click` で展開 | sidebar に PUBLIC + MEMBERS group。user popover（`[data-testid="shell-user-menu"]`）に 3 action | 「プロフィール」「編集申請」「ログアウト」3 action visible / ADMIN group 不在 |
| S3 | `adminPage` | desktop 1280×800 | `goto('/admin')` → `waitShellReady` → user menu 展開 | nav item total 13（PUBLIC 3 + MEMBERS 1 + ADMIN 9）。popover に 4 action | nav item count = 13 / popover に「管理者ダッシュボード」含む 4 action visible |
| S4 | `anonymousPage` | mobile 375×812 | `setViewportSize(375,812)` → `goto('/')` → `waitShellReady` | `[data-testid="shell-sidebar"]` 非表示（drawer 化）。`openDrawer(page)` で `[data-testid="shell-drawer"]` overlay visible | sidebar `not.toBeVisible()` → drawer open 後 `[data-testid="shell-drawer"]` `toBeVisible()` |
| S5 | `anonymousPage` | 1024×800 | `setViewportSize(1024,800)` → `goto('/')` → `waitShellReady` → `toggleCollapse(page)` | sidebar が collapsed（icon のみ）。collapse 状態が `localStorage` に反映 | toggle 後 sidebar に `data-collapsed="true"`（または親 contract の collapsed marker）。`localStorage` の collapse key が truthy |
| S6 | `anonymousPage` | mobile 375×812 | `setViewportSize(375,812)` → `goto('/')` → `openDrawer(page)` → drawer 内リンク click | route 遷移で drawer が auto-close | リンク click 後 `[data-testid="shell-drawer"]` `not.toBeVisible()` |

> nav item / action 数（PUBLIC 3 / MEMBERS 1 / ADMIN 9 / total 13、role 別 action 3 or 4）は親 design spec
> `docs/30-workflows/unified-sidebar-shell-public-and-admin/index.md` のロール語彙と 1:1 整合させる。
> 親実装の実 nav item 数が表と乖離する場合は Phase 5 着手時に親 spec へ同一 wave で整合申し送り（Phase 3 R7）。

### localStorage collapse key（S5）

collapse 状態の localStorage キーは親 Task A（shell primitive）/ Task E の design に従い、Task F 側で新規定義しない（Phase 3 R8）。
Phase 5 着手時に親実装の実キー名を確認し、S5 アサーションの `localStorage.getItem(...)` 引数を確定する。

---

## 2. visual 撮影 matrix（viewport project × role の 7 点）

`apps/web/playwright/tests/sidebar-shell/sidebar-shell-visual.spec.ts` に V1〜V7 を実装する。
viewport は project（`sidebar-shell-visual-desktop/tablet/mobile`）で注入し、各 test は project 名で対象 viewport を限定する（`test.skip(testInfo.project.name !== ...)`）。
role ごとに `anonymousPage` / `memberPage` / `adminPage` を使い分ける。

| # | viewport project | role / fixture | route | 操作 | `toHaveScreenshot` 第1引数 |
|---|------------------|----------------|-------|------|----------------------------|
| V1 | `sidebar-shell-visual-desktop`（1280×800） | viewer / `anonymousPage` | `/` | `waitShellReady` → `freezeAnimations` | `home-1280.png` |
| V2 | `sidebar-shell-visual-desktop` | member / `memberPage` | `/profile` | 同上 | `profile-1280.png` |
| V3 | `sidebar-shell-visual-desktop` | admin / `adminPage` | `/admin` | 同上 | `admin-1280.png` |
| V4 | `sidebar-shell-visual-tablet`（768×1024） | viewer / `anonymousPage` | `/` | 同上 | `home-768.png` |
| V5 | `sidebar-shell-visual-tablet` | admin / `adminPage` | `/admin` | 同上 | `admin-768.png` |
| V6 | `sidebar-shell-visual-mobile`（375×812） | viewer / `anonymousPage` | `/` | 同上 | `home-375.png` |
| V7 | `sidebar-shell-visual-mobile` | admin / `adminPage` | `/admin` | `openDrawer(adminPage)` → `freezeAnimations` | `admin-375-drawer.png` |

screenshot 共通オプション: `{ fullPage: true, maxDiffPixelRatio: 0.02 }`。
第1引数にパス区切り `/` を含めない（`home-` prefix へ正規化 / Phase 3 R5）。

baseline 配置（`playwright.config.ts` の `snapshotPathTemplate`）:

```
playwright/tests/sidebar-shell/sidebar-shell-visual.spec.ts-snapshots/
  home-1280-sidebar-shell-visual-desktop-linux.png
  profile-1280-sidebar-shell-visual-desktop-linux.png
  admin-1280-sidebar-shell-visual-desktop-linux.png
  home-768-sidebar-shell-visual-tablet-linux.png
  admin-768-sidebar-shell-visual-tablet-linux.png
  home-375-sidebar-shell-visual-mobile-linux.png
  admin-375-drawer-sidebar-shell-visual-mobile-linux.png
```

`-linux.png` を正本とし、macOS dev 撮影分は commit しない（不変条件 #1）。

---

## 3. test 構造（list 検証）

Phase 9 で以下を実行し、test entry 数を確認する。

```bash
PLAYWRIGHT_SKIP_WEB_SERVER=1 mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test tests/sidebar-shell --list
```

期待される list:

- smoke spec（`sidebar-shell-smoke.spec.ts`）: S1〜S6 = **6 test**（`sidebar-shell-smoke` project）
- visual spec（`sidebar-shell-visual.spec.ts`）: V1〜V7 を 3 viewport project で展開。各 project は `test.skip` で対象外を skip するため、`--list` は 3 project × (spec 内 test 数) を列挙し、実 run 時の有効件数は **合計 7**（desktop 3 / tablet 2 / mobile 2）になる。

`--list` 時点では skip 対象も entry として列挙される点を Phase 9 で明記し、実 run（`--reporter=line`）で「passed 7 / skipped 残り」になることを確認する。

---

## 4. regression detection dry-run（CONST_005 検証可能性）

目的: AC-6（意図的な shell token / layout 破壊で visual diff が検出される）を保証する。

手順:

1. `apps/web/src/styles/tokens.css` の shell 系 token（例: `--color-surface` を `oklch(98% 0 0)` → `oklch(80% 0 0)`）または shell layout（sidebar width）を一時改変。
2. CI Linux runner で `sidebar-shell-visual-desktop` を回し、baseline（`home-1280` 等）と diff が出て fail することを確認。
3. revert（commit しない。または revert commit）。

dry-run は **必須**。Phase 11 evidence に「regression dry-run 結果（fail スクリーンショット + revert 確認）」を含める。
本 spec 自体は `tokens.css` を変更しないが、dry-run の対象 token として参照する（`verify-design-tokens` gate には影響なし / Phase 7 §3）。

---

## 5. 既存 vitest / unit test との関係

- `_helpers.ts` の `waitShellReady` / `freezeAnimations` / `openDrawer` / `toggleCollapse` は Playwright `Page` への薄いラッパーであり unit test 不要（Phase 6 §2）。
- 本タスクは spec ファイル追加 + `playwright.config.ts` project 追加 + CI job 追加のみで、既存 vitest スイートのソースには触れないため影響なし。
