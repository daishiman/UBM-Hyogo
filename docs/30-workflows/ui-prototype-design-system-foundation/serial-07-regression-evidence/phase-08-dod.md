---
phase: 8
title: DoD / 完了条件
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-07-regression-evidence
status: spec_created
---

# Phase 8 — DoD（Definition of Done）

[実装区分: 実装仕様書]

## 1. 本 SW の DoD 一覧

| # | 条件 | 検証方法 |
|---|------|---------|
| D-01 | `apps/web/playwright/tests/visual/{top,members-list,member-detail,admin-dashboard}.spec.ts` が存在し、`*.spec.ts` suffix を満たす | `ls apps/web/playwright/tests/visual/` |
| D-02 | 4 spec の baseline `*.png` が `*.spec.ts-snapshots/` 配下に物理コミット済 | `git ls-files apps/web/playwright/tests/visual/*-snapshots/*.png` |
| D-03 | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/visual` が exit 0 | CI 実行ログ |
| D-04 | `mise exec -- pnpm verify:tokens` が exit 0（HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 0 件） | `outputs/phase-11/verify-design-tokens.log` |
| D-05 | `mise exec -- pnpm typecheck` が exit 0 | `outputs/phase-11/typecheck.log` |
| D-06 | `mise exec -- pnpm lint` が exit 0 | `outputs/phase-11/lint.log` |
| D-07 | `mise exec -- pnpm --filter @ubm-hyogo/web build` が exit 0（`next build --webpack`） | `outputs/phase-11/build.log` |
| D-08 | `bash scripts/verify-pr-ready.sh` が exit 0 | `outputs/phase-11/verify-pr-ready.log` |
| D-09 | `outputs/phase-11/screenshots/{top,members-list,member-detail,admin-dashboard}.png` が物理存在 | `ls outputs/phase-11/screenshots/` |
| D-10 | Phase 11 inventory 表のすべての evidence が `status: present` | Phase 11 / Phase 12 compliance |
| D-11 | `mise exec -- pnpm verify:phase12-compliance` が exit 0 | CI / local 双方 |
| D-12 | required status check 候補 6 件が Phase 13 PR body に明記されている | Phase 13 |
| D-13 | `apps/api/src/**` / `apps/web/src/components/ui/**` / D1 migrations の diff が 0 行 | `git diff dev...HEAD --stat` |
| D-14 | 新規 CI workflow ファイルが追加されていない | `.github/workflows/` の new file 0 件 |

## 2. SCOPE.md DoD との対応

| SCOPE.md DoD | 本 SW での担保 |
|-------------|--------------|
| #5（4 snapshot 物理存在） | D-02 / D-09 |
| #6（verify-design-tokens green） | D-04 |
| #7（verify-pr-ready exit 0） | D-08 |

SCOPE.md DoD #1..#4 は serial-00..06 で担保済み（本 SW では再検証のみ）。

## 3. 完了報告に含めるべき項目

1. 4 spec の絶対パス
2. 4 baseline PNG の絶対パス
3. evidence ledger（Phase 11 表）の status: pending → present の差分
4. required status check 候補 6 件の context 名
5. CI workflow 変更の有無（あれば path 差分）
6. 残課題 / fallback の発動有無

## 4. 完了とみなさないケース

- baseline が macOS 生成（`-darwin.png` のみ）の場合 — CI 上で `-chromium-linux.png` を生成・コミットするまで未完了
- evidence のいずれかが `pending` のまま — Phase 12 compliance が fail するため未完了
- `playwright-smoke.yml` の trigger path に新規 spec が含まれていない場合 — gate が走らないため未完了
