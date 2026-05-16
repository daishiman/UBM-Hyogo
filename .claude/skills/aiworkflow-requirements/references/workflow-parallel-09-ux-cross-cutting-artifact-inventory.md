# Artifact Inventory: parallel-09 UX cross-cutting primitives

| Field | Value |
| --- | --- |
| canonical workflow root | `docs/30-workflows/parallel-09-ux-cross-cutting/` |
| state | `implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION / implementation_complete_visual_pending` |
| origin spec | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-09-ux-cross-cutting/spec.md` |
| parent workflow | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/` |

## Implementation Files (apps/web)

| Path | Purpose |
| --- | --- |
| `apps/web/src/components/ui/FormField.tsx` | G9-1 form validation wrapper（`aria-invalid` / `aria-describedby` 注入、`--ubm-color-danger` の border / helper text）|
| `apps/web/src/components/ui/EmptyState.tsx` | G9-2 既存 primitive を `icon` / `title` / `description` / `action` 4 props へ拡張（children-only 後方互換維持）|
| `apps/web/src/components/ui/Pagination.tsx` | G9-3 meta + cursor UI（`current` / `total?` / `hasNext` / `hasPrev` / `onNext` / `onPrev`）|
| `apps/web/src/components/ui/Icon.tsx` | G9-4 icon size convention（`IconSize = sm/md/lg/xl` = 12/16/20/24px、`name?: IconName` / `children?` API）|
| `apps/web/src/components/ui/index.ts` | 上記 primitive の barrel export |
| `apps/web/src/components/admin/Breadcrumb.tsx` | G9-5 `nav[aria-label="breadcrumb"]` + `ol`、最終項目 `aria-current="page"` |
| `apps/web/src/lib/useAdminMutation.ts` | G9-8/9 concurrent mutation guard + form state preserve hook |
| `apps/web/src/styles/globals.css` | G9-1 / G9-6 / G9-7 を `@layer components` に追加（parallel-03 と section コメントで分離）|
| `apps/web/app/visual-harness/[name]/page.tsx` | Phase 11 visual fixture route |
| `apps/web/app/visual-harness/[name]/VisualScenarios.client.tsx` | visual scenarios client |
| `apps/web/playwright/tests/visual/parallel-09-primitives.spec.ts` | Playwright visual spec |
| `apps/web/playwright.parallel09.config.ts` | Playwright config for visual harness |

## Tests

| Path | Purpose |
| --- | --- |
| `apps/web/src/components/ui/__tests__/parallel09-primitives.component.spec.tsx` | primitive 単体テスト + a11y assertions |
| `apps/web/src/lib/__tests__/useAdminMutation.spec.tsx` | mutation guard / form state preserve unit |

## Phase 12 strict 7 outputs

`docs/30-workflows/parallel-09-ux-cross-cutting/outputs/phase-12/` 配下に以下全 7 ファイルが存在する:

- `main.md`
- `implementation-guide.md`
- `system-spec-update-summary.md`
- `documentation-changelog.md`
- `unassigned-task-detection.md`
- `skill-feedback-report.md`
- `phase12-task-spec-compliance-check.md`

## Evidence

| Evidence | Status |
| --- | --- |
| local typecheck (`pnpm --filter @ubm-hyogo/web typecheck`) | PASS (exit 0) |
| focused Vitest | blocked before execution by esbuild host/binary mismatch（host 0.27.3 vs binary 0.25.4）|
| Playwright visual screenshots (`outputs/phase-11/screenshots/*.png`) | `runtime_pending` blocked by local `ENOSPC` |
| visual harness route / spec / config | present |

## User-gated boundary

commit / push / PR / GitHub Issue mutation / staging+production smoke / 19 routes 各画面への primitive 適用は parallel-01〜08 側で実施され、本 workflow では未着手のまま user 承認後に進める。
