# Workflow Artifact Inventory — task-09 W3 Tailwind v4 setup

## Canonical Root

- `docs/30-workflows/task-09-w3-par-tailwind-v4-setup/`

## Current State

- `implemented-local / implementation / VISUAL_ON_EXECUTION / local PASS 5-point evidence captured / Phase 13 blocked_pending_user_approval`

## Primary Artifacts

| artifact | role |
| --- | --- |
| `index.md` | workflow overview, AC, dependency boundary |
| `artifacts.json` | root ledger |
| `phase-1.md` ... `phase-13.md` | executable phase specs |
| `outputs/phase-12/*` | strict 7 close-out evidence for spec package |

## Canonical Inputs

- `docs/00-getting-started-manual/specs/09b-design-tokens.md`
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/04-design-system/task-09-w3-par-tailwind-v4-setup.md`
- `docs/00-getting-started-manual/claude-design-prototype/styles.css`

## Implementation Targets

- `apps/web/package.json`
- `apps/web/postcss.config.mjs`
- `apps/web/tailwind.config.ts`
- `apps/web/src/styles/tokens.css`
- `apps/web/src/styles/globals.css`
- `apps/web/src/styles/legacy-public.css`
- `apps/web/app/layout.tsx`
- `apps/web/app/styles.css`
- `apps/web/tsconfig.json`
- `apps/web/src/__tests__/tokens.test.ts`
- `apps/web/src/__tests__/build-output.test.ts`
- `apps/web/src/__tests__/__fixtures__/utility-probe.tsx`
- `pnpm-lock.yaml`

## Phase 11 Evidence

- `outputs/phase-11/evidence/typecheck.log`
- `outputs/phase-11/evidence/tokens-test.log`
- `outputs/phase-11/evidence/build-output-test.log`
- `outputs/phase-11/evidence/generated-css-with-bridge.log`
- `outputs/phase-11/evidence/generated-css-with-oklch.log`
- `outputs/phase-11/evidence/hex-grep-zero.log`
- `outputs/phase-11/evidence/preview-200.log`
- `outputs/phase-11/screenshots/01-top-light.png`

## Boundary

`apps/api/**` is out of scope. task-10 primitives and task-18 CI gate are separate downstream workflows.
