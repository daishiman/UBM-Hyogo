# Phase 11 Manual Smoke Log — issue-769-root-error-focus

## Boundary

- `visualEvidence`: `NON_VISUAL`
- Screenshot evidence: not required
- Manual screen reader smoke: runtime pending until a local browser + screen reader session is available
- Deterministic evidence: tracked under `outputs/phase-11/evidence/`

## Manual Observation Checklist

| Item | Status | Notes |
| --- | --- | --- |
| VoiceOver / NVDA reads `画面を表示できませんでした` immediately | runtime_pending | Requires interactive screen reader session |
| Viewport does not jump on focus transfer | runtime_pending | Covered by code path `focus({ preventScroll: true })`; visual confirmation pending |
| h1 focus outline is not permanently visible | runtime_pending | Depends on existing focus-visible utility |
| Retry button still calls `reset()` | covered_by_test | Existing TC-U-05 |
| digest display remains intact | covered_by_test | Existing TC-U-03 / TC-U-04 |

## Automated Evidence Ledger

| Evidence | Target file |
| --- | --- |
| focused component test | `outputs/phase-11/evidence/web-error-component-test.txt` |
| typecheck | `outputs/phase-11/evidence/typecheck.txt` |
| lint | `outputs/phase-11/evidence/lint.txt` |
| grep gate | `outputs/phase-11/evidence/grep-gate.txt` |

## Automated Result

| Command | Result |
| --- | --- |
| `mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run error.component` | exit 0; package script ran web suite: 89 files / 618 tests passed, 1 skipped |
| `mise exec -- pnpm typecheck` | exit 0 |
| `mise exec -- pnpm lint` | exit 0 |

## Runtime Boundary

Local implementation and deterministic evidence are part of this cycle. Interactive screen reader smoke, commit, push, and PR remain user-gated.
