# 2026-05-14 task-18-FU full visual regression suite spec

## Summary

Synchronized `docs/30-workflows/task-18-fu-full-visual-regression-suite/` as `implemented_local_runtime_pending / implementation / VISUAL`.

## Canonical workflow

- `docs/30-workflows/task-18-fu-full-visual-regression-suite/`

## Canonical contracts

- Extends task-18 W7 from 4 visual baselines to the W7 17 URL route set x 3 viewports = 51 baselines.
- Reuses W7 route topology: public 6 / member 2 / admin 8 / not-found 1.
- Keeps W7 `visual-chromium` project and `apps/web/playwright/tests/visual/*.spec.ts` untouched.
- Baseline update is user-gated by `visual-baseline-approval`.
- Baseline-missing CI failure is not an acceptable required-check state; the implementation PR must include 51 baselines before required check promotion.

## Evidence boundary

This wave creates the spec package, root/output `artifacts.json`, Phase 11 contract walkthrough, and Phase 12 strict 7 outputs. It does not create full 51 screenshot baselines, runtime CI evidence, commit, push, or PR.

## Skill feedback

No new task-specification-creator rule was required. The fix applies existing rules for strict 7 outputs, root/output artifacts parity, state vocabulary, tracked evidence extensions, and visual baseline update gates.
