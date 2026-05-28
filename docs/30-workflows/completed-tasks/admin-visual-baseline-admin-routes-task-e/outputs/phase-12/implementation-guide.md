# Implementation Guide

Status: `implemented_local_runtime_pending`

## Part 1: 中学生レベルの説明

管理画面の見た目を、スマホ・タブレット・PC・横長PCの4種類で写真にして保存する。次に変更が入ったとき、CI が新しい写真と見本写真を比べて、画面が大きく崩れていないか確認する。

詳細ページは会員 ID と会合 ID が必要なので、両方の ID がそろったときだけ撮影する。片方だけ撮って 44 枚にする運用は禁止し、通常は 40 枚、両方そろったら 48 枚にする。

## Part 2: 技術者向け

### 変更対象

| Path | Change |
| --- | --- |
| `apps/web/playwright/tests/visual/admin-shell/*.spec.ts` | admin route visual specs |
| `apps/web/playwright/tests/visual/admin-shell/_helpers.ts` | wait/freeze helper |
| `apps/web/playwright.config.ts` | `admin-staging-visual-{mobile,tablet,desktop,wide}` projects |
| `.github/workflows/playwright-smoke.yml` | `admin-visual` matrix job |

### Baseline Count Contract

| Mode | Route count | Viewport count | PNG count |
| --- | ---: | ---: | ---: |
| default | 10 required | 4 | 40 |
| full | 10 required + 2 env-gated | 4 | 48 |
| forbidden | 11 partial routes | 4 | 44 |

### Commands

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test tests/visual/admin-shell --list
PLAYWRIGHT_SKIP_WEB_SERVER=1 mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test tests/visual/admin-shell --project=admin-staging-visual-desktop --reporter=line
```

### User-Gated Operations

- Linux baseline update and `*-linux.png` placement
- bot baseline push and developer-token empty retrigger commit
- branch protection required status check PUT
- commit, push, PR

---

## Implementation Result (2026-05-27)

### Files added

- `apps/web/playwright/tests/visual/admin-shell/_helpers.ts`
- `apps/web/playwright/tests/visual/admin-shell/dashboard.spec.ts`
- `apps/web/playwright/tests/visual/admin-shell/dashboard-attendance.spec.ts`
- `apps/web/playwright/tests/visual/admin-shell/members-list.spec.ts`
- `apps/web/playwright/tests/visual/admin-shell/members-detail.spec.ts` (env-gated)
- `apps/web/playwright/tests/visual/admin-shell/tags.spec.ts`
- `apps/web/playwright/tests/visual/admin-shell/meetings-list.spec.ts`
- `apps/web/playwright/tests/visual/admin-shell/meetings-detail.spec.ts` (env-gated)
- `apps/web/playwright/tests/visual/admin-shell/schema.spec.ts`
- `apps/web/playwright/tests/visual/admin-shell/schema-history.spec.ts`
- `apps/web/playwright/tests/visual/admin-shell/requests.spec.ts`
- `apps/web/playwright/tests/visual/admin-shell/identity-conflicts.spec.ts`
- `apps/web/playwright/tests/visual/admin-shell/audit.spec.ts`

### Files modified

- `apps/web/playwright.config.ts` — added 4 projects `admin-staging-visual-{mobile,tablet,desktop,wide}` with `setup-authenticated-staging` dependency, `snapshotPathTemplate` per project for `-admin-staging-visual-{viewport}-linux.png` baseline naming, `storageState: ./playwright/.auth/admin.storageState.json` (existing setup-minted path). Extended `isStagingVisual` detection and added `testIgnore` to `visual-chromium` so admin-shell specs do not leak into local visual runs.
- `apps/web/playwright.config.ts` — added admin-shell-specific `EVIDENCE_DIR` routing so reports/test-results land under `docs/30-workflows/completed-tasks/admin-visual-baseline-admin-routes-task-e/outputs/phase-11/evidence` instead of the generic UT-DSF-07 staging visual root.
- `.github/workflows/playwright-smoke.yml` — added `admin-visual` job (matrix `[mobile, tablet, desktop, wide]`) gated by `workflow_dispatch` + `staging_visual_base_url`, with both-or-none detail seed preflight, snapshot update toggle, per-viewport baseline upload, and Task E evidence artifact upload.

### Files deleted

- `apps/web/playwright/tests/visual/admin-dashboard.spec.ts` (statically merged into `admin-shell/dashboard.spec.ts`)
- `apps/web/playwright/tests/visual/admin-dashboard.spec.ts-snapshots/admin-dashboard-visual-chromium-linux.png` (legacy baseline)

### Local verifications run

- `pnpm --filter @ubm-hyogo/web exec playwright test tests/visual/admin-shell --list` → 51 tests in 14 files (12 specs × 4 projects + setup + teardown), routing under `admin-staging-visual-*` projects only.
- `pnpm --filter @ubm-hyogo/web exec playwright test --project=admin-staging-visual-desktop --list` → 15 tests in 14 files (12 specs + setup + teardown), with reports routed to Task E evidence after the evidence-dir fix.
- `pnpm --filter @ubm-hyogo/web typecheck` → pass
- `pnpm --filter @ubm-hyogo/web lint` → pass
- `pnpm verify:phase12-compliance` → ok (`hasCompletedTasksAncestor: false` since workflow is in-flight)
- `pnpm gate-metadata:validate` → OK 506 / ERROR 0

### Deferred to user-gated runtime

Baseline PNG capture, staging deploy verification, bot push + empty retrigger commit, branch protection required check PUT, commit/push/PR remain user-gated per Phase 5/13.

### Notes for follow-up

- `storageState` path was set to the existing setup-minted `apps/web/playwright/.auth/admin.storageState.json` (instead of the spec's draft path `admin-staging.json`) to keep parity with `setup-authenticated-staging`. This avoids introducing a second mint target.
- env-gated detail specs use `test.skip(!DETAIL_SEEDS_READY, ...)` so the 44-PNG forbidden midpoint cannot be produced from CI.
