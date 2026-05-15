# Implementation Guide

## Part 1: 中学生レベル概念説明

画面の見た目は、少しの変更でも気づきにくいことがあります。たとえば、学校の掲示板でポスターを貼り替えたとき、文字が少しずれたり、色が薄くなったりしても、毎日見ている人ほど気づきにくいです。

このタスクは、Webサイトの大事な画面を毎回写真のように記録し、前と比べて見た目が変わっていないか確認する仕組みです。今は確認プログラムと自動実行の入口まで作ってあり、正解写真 51 枚とCI実行結果は、承認付きの手順で後から作る状態です。

| 言葉 | 日常語の言い換え |
| --- | --- |
| baseline | 正しい見本写真 |
| screenshot | 画面の写真 |
| viewport | 画面の大きさ |
| workflow | 自動で確認する手順 |
| artifact | 確認結果として残る記録 |

## Part 2: 技術者向け実装ガイド

### Scope

Implement a new full visual regression suite that expands task-18 W7 from 4 critical screen baselines to the same W7 17 URL route set x 3 viewports = 51 baselines. This workflow root is `implemented_local_runtime_pending`; local implementation files are present, while baseline PNGs and CI evidence remain pending.

### TypeScript contracts

```ts
export type VisualViewportName = "desktop" | "tablet" | "mobile";

export interface VisualViewport {
  readonly name: VisualViewportName;
  readonly width: number;
  readonly height: number;
}

export interface VisualRoute {
  readonly slug: string;
  readonly path: string;
  readonly auth: "none" | "member" | "admin";
  readonly masks?: readonly string[];
}
```

### Implemented and pending files

| Path | Status | Purpose |
| --- | --- | --- |
| `apps/web/playwright/fixtures/viewports.ts` | implemented | Desktop/tablet/mobile constants |
| `apps/web/playwright/fixtures/visual-routes.ts` | implemented | 17 route contract with auth metadata and runtime count guard |
| `apps/web/playwright/tests/visual-full/full-visual.spec.ts` | implemented | Route loop and screenshot assertions |
| `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/*.png` | runtime pending | 51 Linux baseline files |
| `.github/workflows/playwright-visual-full.yml` | implemented | PR path-filter + nightly execution |
| `.github/workflows/playwright-visual-baseline-update.yml` | implemented | User-approved baseline update workflow |

### Runtime and error handling

- Runtime evidence must be captured in CI/Linux or another approved equivalent; macOS local screenshot output is review-only.
- `.log` files are not canonical evidence. Use tracked `.txt` / `.json`.
- Baseline update requires the `visual-baseline-approval` environment.
- If CI time exceeds budget, reduce PR trigger scope first; do not shrink the 17-route canonical list without updating Phase 1 and aiworkflow ledgers in the same wave.

---

## 実装結果（2026-05-14 実装サイクル）

### 実コードへの反映

| パス | 種別 | 反映状況 |
|------|------|---------|
| `apps/web/playwright/fixtures/viewports.ts` | 新規 | ✅ |
| `apps/web/playwright/fixtures/visual-routes.ts` | 新規 | ✅（`EXPECTED_VISUAL_ROUTE_COUNT` runtime guard で 17 件保証） |
| `apps/web/playwright/tests/visual-full/full-visual.spec.ts` | 新規 | ✅ |
| `apps/web/playwright.config.ts` | 編集 | ✅（`visual-full-chromium-{desktop,tablet,mobile}` 3 project 追加、`visual-full/` ignore、task-18-fu evidence dir routing） |
| `apps/web/package.json` | 編集 | ✅（`PLAYWRIGHT_EVIDENCE_TASK=task-18-fu` 付き `test:visual-full` / `test:visual-full:update`） |
| `.github/workflows/playwright-visual-full.yml` | 新規 | ✅（task-18-fu evidence routing + failure artifact path） |
| `.github/workflows/playwright-visual-baseline-update.yml` | 新規 | ✅（task-18-fu evidence routing） |
| `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/*.png` | 新規（51 件） | ⏸ 別 PR にて `playwright-visual-baseline-update.yml` 経由で取り込む |

### 設計仕様との差分

Phase 2 設計は `storageState` + `setup-auth-{member,admin}` 依存 project を前提としていたが、現行リポジトリの `apps/web/playwright/` にそれら setup project は存在せず、認証は `playwright/fixtures/auth.ts` の `adminLogin(context)` / `memberLogin(context)` ヘルパー経由（W7 既存 visual spec と同方式）。新 spec も同方式に揃え、新規 setup project の導入は見送った。

### ローカル検証

- `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` → PASS
- `mise exec -- pnpm --filter @ubm-hyogo/web lint` → PASS

baseline 取得とその diff 検証はローカル macOS では完了扱いにせず、`workflow_dispatch` 経由で ubuntu-latest 上で実施（Phase 5 仕様通り）。現時点のスクリーンショット参照は `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/*.png` の将来成果物であり、実 PNG は未存在として扱う。
