# Unassigned Task Detection

## Result

Detected count: 1

## In-Package Task Specs (this cycle, both completed)

- `tasks/task-01-public-home-css-rules.md`
- `tasks/task-02-cta-classname-cleanup.md`

## Detected Follow-up

| ID | Path | Classification | Reason |
| --- | --- | --- | --- |
| home-page-prototype-alignment-followup-001 | `docs/30-workflows/unassigned-task/home-page-prototype-alignment-followup-001-terms-prefetch-env-validation.md` | bugfix / runtime | Phase 11 manual test で JavaScript 有効時に `/` 描画が `/terms` route の env validation prefetch throw で阻害される事象を確認。本ワークフローは CSS selector / data-role 統一スコープのため、`/terms` env validation の根治は別タスクとして切り出した。 |

## Rationale

`/terms` env validation の throw は `apps/web/src/lib/env.ts` の build-time / request-time 検証起点であり、CSS selector / className cleanup スコープを超える。Phase 11 では JavaScript 無効スクリーンショットで CSS validation を分離し、deploy 検証は user-gated とした上で、prefetch 経路の env error は followup-001 として `unassigned-task/` 配下に独立タスク化した。

## CONST_005 Check

No discovered improvement was deferred silently. The CSS / data-role / token-gate findings were applied to real files in this cycle. The single remaining followup (`/terms` env validation prefetch) is explicitly tracked under `docs/30-workflows/unassigned-task/` per CONST_005.
