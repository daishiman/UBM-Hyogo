# Phase 11 — Evidence Inventory

## 1. Mode

`VISUAL`（baseline PNG 2 枚と取得ログ）。

## 2. evidence 配置

| Path | Status | 種別 | 備考 |
|------|--------|------|------|
| outputs/phase-11/evidence/playwright-list-staging-visual.txt | present | local `playwright test --list` 結果 | 6 tests 列挙確認 |
| outputs/phase-11/evidence/typecheck.log | present | `pnpm --filter @ubm-hyogo/web typecheck` ログ | exit 0 |
| outputs/phase-11/evidence/lint.log | present | `pnpm --filter @ubm-hyogo/web lint` ログ | exit 0 |
| outputs/phase-11/evidence/verify-pr-ready.log | present | `scripts/verify-pr-ready.sh` ログ | compliance / gate metadata PASS、index diff は本作業の未コミット差分 |
| outputs/phase-11/evidence/members-list-staging-visual-chromium-linux.png | pending | CI 生成 baseline | コミット先は `apps/web/playwright/tests/visual-staging/members-list.spec.ts-snapshots/` |
| outputs/phase-11/evidence/member-detail-staging-visual-chromium-linux.png | pending | CI 生成 baseline | 同上 / `PLAYWRIGHT_MEMBER_DETAIL_ID` 注入 cycle に依存 |
| outputs/phase-11/evidence/staging-visual-run.log | pending | `staging-visual` job 実行ログ | diff < 5% で pass |
| screenshot evidence の親 mirror | n/a | 親 UT-DSF-07 への mirror | 不要（独立 workflow root として運用） |

## 3. 取得手順（runtime / PR pre-flight）

1. local: `mise exec -- pnpm typecheck && pnpm lint` → log を `outputs/phase-11/evidence/` へ tee
2. local: `pnpm --filter @ubm-hyogo/web exec playwright test --project=staging-visual --list > outputs/phase-11/evidence/playwright-list-staging-visual.txt`
3. CI dispatch: `playwright-smoke.yml` `update_baselines` を true で実行 → artifact `staging-visual-baselines` から 2 枚 download
4. PNG を `*.spec.ts-snapshots/` に配置 + `outputs/phase-11/evidence/` に複製 → commit
5. 再 push 後 `staging-visual` job ログを `outputs/phase-11/evidence/staging-visual-run.log` に記録
