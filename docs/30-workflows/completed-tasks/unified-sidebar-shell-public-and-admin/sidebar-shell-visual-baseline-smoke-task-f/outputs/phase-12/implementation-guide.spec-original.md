---
実装区分: 実装仕様書
状態: spec_created
Phase: 12
作成日: 2026-05-29
task_id: sidebar-shell-visual-baseline-smoke-task-f
---

# Implementation Guide

## Part 1: 中学生レベルの説明

公開・会員・管理の 3 種類のページで使う「折りたためる横メニュー（sidebar shell）」が壊れていないかを、ロボット（Playwright）に自動で確かめさせる。
ロボットは 3 種類の人（未ログイン / 会員 / 管理者）になりきって 3 つの画面サイズ（PC / タブレット / スマホ）で画面を開き、お手本画像（baseline）7 枚と比べる。
さらに「メニューの中身が正しいか」「スマホで引き出しが開く・閉じるか」などを 6 件の smoke でざっと確認する。お手本画像は OS で少し差が出るので、CI の Linux で撮ったものだけを正本にする。

## Part 2: 技術者向け

### 背景

統合 collapsible Sidebar Shell（親 Task A-E）の regression を CI で検出するため、Playwright で 3 role × 3 viewport の visual baseline（7 screenshot）+ 6 smoke を捕捉する。
E2E 正本 dir は `apps/web/playwright/tests/`。source task が記載した `apps/web/tests/e2e/sidebar-shell-*.spec.ts` は実構造と乖離しており、phase-1 §7 で `apps/web/playwright/tests/sidebar-shell/` へ補正済み。
認証は既存 `apps/web/playwright/fixtures/auth.ts` の拡張 `test`（`anonymousPage` / `memberPage` / `adminPage` + `mockApi`）を再利用し、新規 storageState を作らない。

### 実装ステップ（親 Task A-E 完了後の execution wave）

1. `apps/web/playwright/tests/sidebar-shell/_helpers.ts`: `waitShellReady` / `freezeAnimations` / `openDrawer` / `toggleCollapse` を集約（phase-2 §4）。
2. `sidebar-shell-smoke.spec.ts`: S1-S6 を実装（phase-2 §5）。role は auth fixture、375/1024 幅は context / `setViewportSize` で生成。
3. `sidebar-shell-visual.spec.ts`: V1-V7 を `toHaveScreenshot(<arg>, { fullPage: true, maxDiffPixelRatio: 0.02 })` で撮影。viewport は project 注入、role は spec 選択（phase-2 §6）。
4. `playwright.config.ts`: `sidebar-shell-visual-{desktop,tablet,mobile}` 3 project 追加（`admin-staging-visual-*` の snapshotPathTemplate 前例に準拠）+ `desktop-chromium` / `visual-chromium` の testIgnore に visual spec 追加（phase-2 §7）。
5. `.github/workflows/playwright-smoke.yml`: `smoke (chromium)` matrix へ smoke 追加 + `visual (sidebar-shell)` 3 viewport matrix 追加（phase-2 §8）。

### 不変条件

- `-linux.png` を正本とし、macOS 撮影分 `-darwin.png` は commit しない。
- 認証経路は既存 auth fixture の拡張 `test` のみ（新規 storageState 禁止 / AC-8）。
- `toHaveScreenshot` 第 1 引数にパス区切り `/` を含めない（`home-` prefix 正規化 / phase-1 不変条件 6）。
- spec ファイルは `*.spec.ts` のみ（CLAUDE.md 不変条件 #8）。

### 検証コマンド（execution wave で実行）

```bash
mise exec -- pnpm --filter @ubm/web exec playwright test sidebar-shell-smoke
mise exec -- pnpm --filter @ubm/web exec playwright test --project=sidebar-shell-visual-desktop
find apps/web/playwright/tests/sidebar-shell -name '*-sidebar-shell-visual-*-linux.png' | wc -l   # 期待 7
mise exec -- pnpm typecheck && mise exec -- pnpm lint
```

### 既知制限 / user-gated 境界

- 実 baseline 撮影・bot baseline push 後の空コミット再トリガー（GITHUB_TOKEN は `pull_request` 非発火）・required status check PUT・commit / push / PR は全て Gate-C user-gated。
- 親 Task A-E が `spec_created` のため shell component / `data-testid` は未実装。selector 契約は親実装後に確定し、不足は同一 wave で親 spec へ申し送り（phase-3 R7）。
