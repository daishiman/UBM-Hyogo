# System Spec Update Summary: ut-web-cov-04-admin-lib-ui-primitives-coverage

## Step 1-A: Task Record

- status: implemented-local / implementation / NON_VISUAL
- current scope: admin lib and UI primitives coverage hardening
- canonical path: `docs/30-workflows/ut-web-cov-04-admin-lib-ui-primitives-coverage/`

## Step 1-B: Implementation Status

| Item | Status |
| --- | --- |
| workflow root | implemented-local / implementation / NON_VISUAL |
| lib/component tests | executed: 44 files / 322 tests PASS |
| visual/runtime evidence | NON_VISUAL; coverage evidence executed |

## Step 1-C: Related Tasks

- Depends on: 06c-A-admin-dashboard
- Blocks: 09b-A-observability-sentry-slack-runtime-smoke
- Same-wave inventory: `.claude/skills/aiworkflow-requirements/references/workflow-ut-coverage-2026-05-wave-artifact-inventory.md` records the same canonical path.

## Step 2: Interface Update Judgment

判定: 正本仕様ファイルへの即時 API / shared type / config 更新は N/A。代わりに、後続実装 close-out 時の同期候補を予約する。

| Candidate | Sync timing |
| --- | --- |
| coverage gate target: Stmts/Lines/Funcs >=85% and Branches >=80% for the 13 files | synced in `outputs/phase-11/coverage-diff.md` |
| admin lib mock contract: authed fetch / error mapping / type guard | synced through `apps/web/src/lib/admin/__tests__/*` |
| barrel smoke rule for `icons.ts` and `components/ui/index.ts` | synced through `apps/web/src/components/ui/__tests__/{icons,index}.test.ts` |

## Step 3: Stale Path Withdrawal

旧 `docs/30-workflows/ut-coverage-2026-05-wave/wave-2-parallel-coverage/ut-web-cov-04-admin-lib-ui-primitives-coverage/` は historical wave grouping path とし、現在の正本参照は top-level workflow root に統一する。
