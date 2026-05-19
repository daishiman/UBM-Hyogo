# Phase 11: 証跡収集

## visualEvidence

`VISUAL` — UI skeleton 変更のため Playwright screenshot を Phase 11 証跡として保存する。
理由: `loading.tsx` は static markup だが、avatar + heading + 4 KV bars の見た目が DoD であり、DOM assertion だけでは形状の回帰を十分に説明できない。

## 4. Phase 11 evidence file inventory

| # | Path | Status | 取得方法 |
|---|------|--------|---------|
| 1 | `outputs/phase-11/evidence/typecheck.log` | present | `mise exec -- pnpm typecheck 2>&1 \| tee ...` |
| 2 | `outputs/phase-11/evidence/lint.log` | present | `mise exec -- pnpm lint 2>&1 \| tee ...` |
| 3 | `outputs/phase-11/evidence/test.log` | present | `mise exec -- pnpm -F @ubm-hyogo/web test -- --run profile/loading 2>&1 \| tee ...` |
| 4 | `outputs/phase-11/evidence/build.log` | present | `mise exec -- pnpm -F @ubm-hyogo/web build 2>&1 \| tee ...` |
| 5 | `outputs/phase-11/evidence/grep-gate.log` | present | Phase 9 grep 3 種を集約 |
| 6 | `outputs/phase-11/screenshots/profile-loading-skeleton.png` | present | `PLAYWRIGHT_SKIP_WEB_SERVER=1 pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/visual/profile-loading-skeleton.spec.ts --project=visual-chromium`（dev server 手動起動済み） |

> Path は workflow root (`docs/30-workflows/profile-loading-skeleton-oklch/`) からの相対パス。

## 証跡内容の最低基準

| log | 必須内容 |
|-----|---------|
| typecheck.log | exit 0 / 0 error |
| lint.log | exit 0 / 0 error 0 warn |
| test.log | `apps/web/app/profile/loading.spec.tsx` の 4 tests を含む PASS 行、または web 全体 PASS |
| build.log | "Compiled successfully" 相当 / route `/profile` 出現 |
| grep-gate.log | "OK: no HEX literals" / "OK: no arbitrary color" / "OK: scope intact" |
| profile-loading-skeleton.png | avatar circle / heading bar / 4 KV bars が `bg-surface-2` skeleton として視認できる |

## 実測メモ

- `test.log`: web Vitest 全体が実行され、`apps/web/app/profile/loading.spec.tsx` 4 tests を含む 95 files / 680 tests PASS。
- `grep-gate.log`: `bg-surface-2` bridge、component-level HEX 0 件、arbitrary color 0 件、scope intact を確認。
- `screenshots/profile-loading-skeleton.png`: dev-only visual harness `/visual-harness/profile-loading` で `ProfileLoading` を描画し、skeleton 形状を保存。

## 完了条件

- [x] 5 evidence file と screenshot 全て physical 存在
- [x] 各 log の最低基準を満たす
- [x] inventory 表を canonical 9 headings 仕様で記載
