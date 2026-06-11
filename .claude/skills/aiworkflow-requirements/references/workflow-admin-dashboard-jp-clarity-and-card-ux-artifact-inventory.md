# Artifact Inventory: admin-dashboard-jp-clarity-and-card-ux

## Summary

| Item | Value |
| --- | --- |
| workflow | `docs/30-workflows/completed-tasks/admin-dashboard-jp-clarity-and-card-ux/` |
| status | `implemented_local_runtime_pending / implementation / VISUAL / staging_visual_pending_user_gate` |
| scope | `apps/web` admin dashboard presentation layer only |
| invariant | `apps/api` / D1 migrations / Google Form schema / shared API surface unchanged |

## Implemented Artifacts

| Area | Paths |
| --- | --- |
| glossary SSOT | `apps/web/src/lib/admin/dashboardGlossary.ts`, `apps/web/src/lib/admin/__tests__/dashboardGlossary.spec.ts` |
| dashboard cards | `apps/web/src/features/admin/components/_dashboard/{KpiGrid,KpiCard,SchemaAlertCard,ZoneDistribution,RecentActionsTable,StatusDistribution}.tsx` |
| audit glossary reuse | `apps/web/src/components/admin/AuditLogPanel.tsx`, `apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx` |
| focused tests | `apps/web/src/features/admin/components/__tests__/{KpiGrid,RecentActionsTable}.spec.tsx`, `apps/web/src/features/admin/components/_dashboard/StatusDistribution.spec.tsx`, `apps/web/src/features/admin/components/_dashboard/__tests__/{SchemaAlertCard,ZoneDistribution}.spec.tsx`, `apps/web/src/lib/admin/__tests__/dashboardGlossary.spec.ts`, `apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx` |
| workflow docs | `docs/30-workflows/completed-tasks/admin-dashboard-jp-clarity-and-card-ux/**` |

## Evidence

| Command | Result |
| --- | --- |
| `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/lib/admin/__tests__/dashboardGlossary.spec.ts apps/web/src/features/admin/components/__tests__/KpiGrid.spec.tsx apps/web/src/features/admin/components/__tests__/RecentActionsTable.spec.tsx apps/web/src/features/admin/components/_dashboard/StatusDistribution.spec.tsx apps/web/src/features/admin/components/_dashboard/__tests__/SchemaAlertCard.spec.tsx apps/web/src/features/admin/components/_dashboard/__tests__/ZoneDistribution.spec.tsx apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx` | PASS: 7 files / 77 tests |
| `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| `mise exec -- pnpm --filter @ubm-hyogo/web lint` | PASS |
| `mise exec -- pnpm verify:tokens` | PASS |
| `git diff --name-only -- apps/api migrations docs/00-getting-started-manual/specs` | empty |
| `curl -I -sS http://localhost:3000/admin` | 307 to `/login?gate=admin_required` |

## User-Gated Items

- Authenticated staging screenshots for `/admin`.
- Commit, push, PR.
- `/admin/audit` glossary reuse was initially split, then resolved same-cycle during automation-30 review. The trace remains at `docs/30-workflows/completed-tasks/admin-dashboard-jp-clarity-and-card-ux/unassigned-task-specs/admin-audit-page-jp-action-labels.md`.

## Lessons Learned

| Lesson ID | Topic | Notes |
| --- | --- | --- |
| L-ADDJC-001 | automation-30 glossary 適用漏れの同サイクル後追い解消 | `dashboardGlossary.ts` を SSOT 化した直後の automation-30 レビューで、`/admin/audit`（`AuditLogPanel.tsx`）が同じ raw action / target を日本語化せず残っていることを検出。別 wave へ送らず同サイクルで `describeAuditAction` / `describeTargetType` を再利用して解消し、経緯は `unassigned-task-specs/admin-audit-page-jp-action-labels.md` に resolved_same_cycle trace として co-locate（未タスク backlog ではない）。教訓: glossary SSOT を新設したら、同じ raw code を表示する**全 consumer を同 wave で grep して reuse 漏れを潰す**。 |
| L-ADDJC-002 | StatusDistribution の 600px 固定 SVG → 横バー list 大幅 simplify | 縦棒 SVG（width 600 固定）が狭幅で破綻し情報過多だった。`<ul role="img">` + `viewBox="0 0 100 8"` の横バー list へ再構成し DOM・a11y semantics を保ちつつ ~140→ロジック圧縮。教訓: 表現層 simplify は**既存 testid / role / aria を contract として固定**し、構造変更でも focused spec が壊れない形に保つ（StatusDistribution.spec は更新のみで GREEN）。 |
| L-ADDJC-003 | skill-sync の test 数は実行 ground truth で確定する | 先行同期で SKILL-changelog / LOGS / task-workflow-active へ「5 files / 24 tests」と記載されたが、artifact-inventory 記載コマンドを実行すると **7 files / 77 tests** が正。新規追加分のみのカウントと総数が混在し stale 矛盾を生んだ。教訓: changelog 系の test 数は**必ず inventory の evidence コマンドを再実行して総数で統一**し、複数 entry 間で同一値に揃える。 |
