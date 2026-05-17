[実装区分: 実装仕様書]

# Phase 1: 要件定義

## 目的

Issue #709 の本質要件「visual gate 4 surface → 17 URL surfaces への baseline 拡張」のうち、task-18-fu で残った **runtime_pending** 部分を解消し、PR 上で `playwright-visual-full` check が実行できる状態へ持ち込む。dev / main branch protection の required check 化は governance 変更であり、本タスク完了後の formal follow-up で扱う。

## 入力

- Issue #709（state: OPEN, body: visual baseline expansion）
- 既存 spec: `apps/web/playwright/tests/visual-full/full-visual.spec.ts`
- 既存 fixture: `apps/web/playwright/fixtures/visual-routes.ts`
- 既存 workflow: `.github/workflows/playwright-visual-full.yml`, `.github/workflows/playwright-visual-baseline-update.yml`
- coverage matrix: `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md`

## 1. タスク分類

| 軸 | 値 |
|----|---|
| 種別 | implementation task |
| visual classification | VISUAL（51 baseline 取得が主成果物） |
| implementation_mode | `runtime_capture_plus_workflow_edit` |
| 主成果物 | `VISUAL_ROUTES.length × 3 viewport` baseline PNG（現時点 17 × 3 = 51）, workflow edit, evidence, matrix 更新 |

## 2. baseline 取得対象（17 routes × 3 viewport = 51 件）

`apps/web/playwright/fixtures/visual-routes.ts` の `VISUAL_ROUTES` 配列をそのまま正本とする。現時点の route 数 17 件 × viewport 3 件で **51 baseline PNG**。DoD は固定 51 ではなく `VISUAL_ROUTES.length × visual-full project count` を主判定とし、51 は現時点の期待値として扱う。

viewport は `playwright.config.ts` の `visual-full-chromium-{desktop,tablet,mobile}` project で定義済み。

## 3. baseline 命名規約（既存 spec 由来）

```
full-visual-{slug}-{viewport}-{project-suffix}.png
```

例: `full-visual-root-desktop-visual-full-chromium-desktop.png`

格納先: `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/`

> 命名は `full-visual.spec.ts:25` の `toHaveScreenshot(`full-visual-${route.slug}-${viewport}.png`, ...)` と Playwright project 名サフィックスにより自動生成される。

## 4. workflow 編集要件

### 4.1 `playwright-visual-full.yml`

| 要件 | 詳細 |
|------|------|
| PR trigger 復活 | `pull_request:` ブロックのコメントアウトを解除し、path-filter 6 件（`apps/web/src/**`, `apps/web/playwright.config.ts`, `apps/web/playwright/tests/visual-full/**`, `apps/web/playwright/fixtures/**`, `apps/web/src/styles/tokens.css`, `.github/workflows/playwright-visual-full.yml`）を有効化 |
| MVP-PAUSE コメント削除 | `# MVP-PAUSE 2026-05-15: PR trigger を一時停止` の 3 行コメントブロックを削除 |
| baseline 存在チェック step は維持 | runtime safety net として残す |

### 4.2 `playwright-visual-baseline-update.yml`

編集なし。`workflow_dispatch` で叩いて baseline PR を生成する用途で利用するのみ。

## 5. 変更対象ファイル

| パス | 種別 | 内容 |
|------|------|------|
| `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/*.png` | 新規（最大 51 件） | `playwright-visual-baseline-update` workflow の create-pull-request action 経由で取り込み |
| `.github/workflows/playwright-visual-full.yml` | 編集 | §4.1 |
| `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` | 編集 | "Visual baseline 4/19 → 17/19"、Drift Notes / Future Candidates から該当行を削除 |
| `docs/30-workflows/task-709-visual-baseline-runtime-capture/outputs/phase-*/*.md` | 新規 | phase 9 / 10 / 11 / 12 の evidence |

## 6. 受入条件（DoD）

1. `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/` に `visual-routes.ts` の長さ × viewport 数（現時点 51）PNG が存在する
2. `.github/workflows/playwright-visual-full.yml` の `pull_request:` ブロックがアクティブ（コメントアウトされていない）
3. baseline 取得後、同一 SHA に対し `playwright-visual-full.yml` の 3 viewport job が 2 連続 PASS する（flaky でないこと）
4. `pnpm typecheck` / `pnpm lint` が PASS
5. `SMOKE-COVERAGE-MATRIX.md` の "Visual baseline" 行が `17/19` になり、Drift Notes / Future Candidates の関連エントリが解消されている
6. Phase 11 evidence に 51 PNG の filename + sha256 が記録されている
7. issue #709 本文の検証方法（`pnpm --filter @ubm-hyogo/web playwright test --project=chromium apps/web/playwright/tests/visual`）に **加えて** visual-full 3 viewport project の実行ログが evidence として残っている

## 7. スコープ out（本タスクに含めない）

- `error.tsx` / `loading.tsx` の fixture 設計（別 follow-up）
- viewport 追加（4 種以上）
- branch protection required check の `gh api -X PUT` 実行（governance 別承認サイクル — 候補化のみ phase-12 で言及）
- task-18-fu で既に解決済みの infra 再設計

## 8. 不変条件再掲

- 既存 W7 4 baseline (`apps/web/playwright/tests/visual/*.spec.ts`) は破壊しない
- screenshot drift 抑止設定 (`animations: 'disabled'` 等) を改変しない
- `maxDiffPixelRatio: 0.02` を維持
- D1 直接アクセス禁止 / 既存 API surface のみ

## 9. 成果物

- 本ファイル `phase-1-requirements.md`
