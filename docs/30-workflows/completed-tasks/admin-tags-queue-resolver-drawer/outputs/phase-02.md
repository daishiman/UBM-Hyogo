# Phase 2 — Validation Matrix

各 V-N は local gate / CI gate / evidence canonical path を定める。失敗時は Phase 5 / 6 / 11 のループに戻り、合格まで rerun。

| ID | 種別 | command | 期待 exit | 失敗時対応 | evidence canonical path |
| --- | --- | --- | --- | --- | --- |
| V-1 | typecheck | `mise exec -- pnpm typecheck` | 0 | 型不整合は Phase 5 で修正 | `outputs/phase-11/logs/typecheck.log` |
| V-2 | lint | `mise exec -- pnpm lint` | 0 | `pnpm lint --fix` を Phase 5 で適用 | `outputs/phase-11/logs/lint.log` |
| V-3 | unit (drawer) | `mise exec -- pnpm --filter @ubm-hyogo/web test -- TagsQueueResolveDrawer.spec.tsx --run` | 0 | Phase 6 で test 拡充 | `outputs/phase-11/logs/test-drawer.log` |
| V-4 | unit (panel) | `mise exec -- pnpm --filter @ubm-hyogo/web test -- TagQueuePanel.component.spec.tsx --run` | 0 | regression を Phase 6 で修正 | `outputs/phase-11/logs/test-panel.log` |
| V-5 | unit (api helper) | `mise exec -- pnpm --filter @ubm-hyogo/web test -- src/lib/admin/__tests__/api.spec.ts --run` | 0 | mutation key 検査が失敗したら Phase 5 で再整合 | `outputs/phase-11/logs/test-api.log` |
| V-6 | design-token | `mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens` | 0 | HEX 直書きを Phase 5 で token 化 | `outputs/phase-11/logs/design-tokens.log` |
| V-7 | playwright smoke | `mise exec -- pnpm --filter @ubm-hyogo/web test:e2e -- admin-tags` | 0 | smoke fail は Phase 11 で screenshot + ログ確保 | `outputs/phase-11/logs/playwright-smoke.log` |
| V-8 | visual screenshot | `node scripts/capture-admin-tags.mjs`（Phase 11 手順） | 0 + 5 PNG | 取得漏れは Phase 11 で rerun | `outputs/phase-11/screenshots/*.png` |
| V-9 | a11y check | `axe-core` 経由（Playwright 内で `injectAxe` / `checkA11y`） | violations.length === 0 | violation を Phase 5 / 8 で修正 | `outputs/phase-11/logs/axe.json` |
| V-10 | grep guard (#13) | `rg "tag_assignment" apps/web/src --files-with-matches \| grep -v "queue"` | non-zero（matches 無し） | 違反箇所を Phase 5 で削除 | `outputs/phase-11/logs/grep-inv13.log` |

## Phase 11 evidence canonical paths

- `outputs/phase-11/screenshots/admin-tags-drawer-closed.png`
- `outputs/phase-11/screenshots/admin-tags-drawer-confirmed-open.png`
- `outputs/phase-11/screenshots/admin-tags-drawer-rejected-open.png`
- `outputs/phase-11/screenshots/admin-tags-drawer-validation-error.png`
- `outputs/phase-11/screenshots/admin-tags-drawer-terminal-disabled.png`
- `outputs/phase-11/manual-test-result.md`
- `outputs/phase-11/phase11-capture-metadata.json`

## 合否判定ルール

全 V-1..V-10 が green かつ Phase 11 canonical evidence 5 枚 PNG + metadata が揃った時のみ Phase 12 に進む。

## 現行コマンド契約確認

2026-05-17 時点の `package.json` / `apps/web/package.json` 実測では root に `verify:tokens`、`@ubm-hyogo/web` に `verify-design-tokens` が存在する。従って本 workflow の design token gate は package-local script を正本とし、存在しない `pnpm verify:design-tokens` は使用しない。
