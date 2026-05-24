---
phase: 8
title: DoD / 完了条件
workflow_id: ut-dsf-07-staging-visual-runtime-evidence
status: spec_created
---

# Phase 8 — DoD（Definition of Done）

[実装区分: 実装仕様書]

## 1. 本タスクの DoD 一覧

| # | 条件 | 検証方法 |
|---|------|---------|
| D-01 | `apps/web/playwright/tests/visual-staging/{public-top,login,profile,admin-dashboard}.spec.ts` が存在し `*.spec.ts` suffix を満たす | `ls apps/web/playwright/tests/visual-staging/` |
| D-02 | `playwright.config.ts` に `staging-visual` project + `isStagingVisual` 分岐が追加されている | `git diff dev...HEAD -- apps/web/playwright.config.ts` |
| D-03 | `apps/web/package.json` に `e2e:visual:staging` script が追加されている | `grep e2e:visual:staging apps/web/package.json` |
| D-04 | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` が成功 | `outputs/phase-11/staging-deploy.log`（exit 0） |
| D-05 | 4 spec の baseline `*-staging-visual-chromium-linux.png` が `*.spec.ts-snapshots/` 配下に物理コミット済 | `git ls-files apps/web/playwright/tests/visual-staging/*-snapshots/*.png` |
| D-06 | `e2e:visual:staging`（staging URL に対し）が exit 0 / diff < 5% | `outputs/phase-11/playwright-staging-visual.log` |
| D-07 | `mise exec -- pnpm typecheck` が exit 0 | `outputs/phase-11/typecheck.log` |
| D-08 | `mise exec -- pnpm lint` が exit 0 | `outputs/phase-11/lint.log` |
| D-09 | `mise exec -- pnpm --filter @ubm-hyogo/web build` が exit 0（`next build --webpack`） | `outputs/phase-11/build.log` |
| D-10 | `bash scripts/verify-pr-ready.sh` が exit 0 | `outputs/phase-11/verify-pr-ready.log` |
| D-11 | `outputs/phase-11/screenshots/{public-top,login,profile,admin-dashboard}.png` が物理存在 | `ls outputs/phase-11/screenshots/` |
| D-12 | Phase 11 inventory 表のすべての evidence が `status: present` 以上 | Phase 11 / Phase 12 compliance |
| D-13 | `mise exec -- pnpm verify:phase12-compliance` が exit 0 | CI / local 双方 |
| D-14 | parent `ui-prototype-design-system-foundation` の `index.md` / `artifacts.json` が `VISUAL_RUNTIME_OK` + Gate-B/C `passed` に更新済 | `grep VISUAL_RUNTIME parent index.md / artifacts.json` |
| D-15 | required status check 候補が Phase 13 PR body に明記されている | Phase 13 |
| D-16 | `apps/api/src/**` / `apps/web/src/**` / D1 migrations の diff が 0 行 | `git diff dev...HEAD --stat` |
| D-17 | 新規 CI workflow ファイルが追加されていない | `.github/workflows/` の new file 0 件 |

## 2. parent root workflow gate との対応

| parent gate | 本タスクでの担保 |
|-------------|--------------|
| `VISUAL_RUNTIME_PENDING` → `VISUAL_RUNTIME_OK` | D-14 |
| Gate-B（implementation_review: staging deploy + 4 screens capture） | D-04 / D-05 / D-06 |
| Gate-C（external_ops: runtime screenshots / root release / PR / merge） | D-11 / D-14 / Phase 13 |

## 3. 完了報告に含めるべき項目

1. 4 spec の絶対パス
2. 4 baseline PNG の絶対パス（`-staging-visual-chromium-linux.png`）
3. staging deploy version / URL
4. evidence ledger（Phase 11 表）の status: pending → present の差分
5. required status check 候補の context 名
6. parent gate 解除の diff（`VISUAL_RUNTIME_OK` + Gate-B/C）
7. 残課題 / fallback の発動有無（認証後画面の runtime 検証は OUT）

## 4. 完了とみなさないケース

- baseline が macOS 生成（`-darwin.png` のみ）— CI 上で `-staging-visual-chromium-linux.png` を生成・コミットするまで未完了。
- evidence のいずれかが `pending` のまま — Phase 12 compliance fail のため未完了。
- staging deploy が未実施で baseline を local dev server から取得した場合 — production-equivalent runtime の要件未達のため未完了。
- parent `index.md` / `artifacts.json` が `VISUAL_RUNTIME_PENDING` のまま — root gate 未解除のため未完了。
