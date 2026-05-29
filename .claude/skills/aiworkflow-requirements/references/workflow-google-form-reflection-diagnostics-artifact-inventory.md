# google-form-reflection-diagnostics artifact inventory

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/google-form-reflection-diagnostics/` |
| status | `implemented_local_runtime_pending / implementation / VISUAL` |
| purpose | Google Form 31 項目が admin / profile / public 3 経路で反映されない事象を H1 ingest / H2 identity / H3 visibility / H4 alias に切り分ける |
| implementation | `apps/api/src/diagnostics/{schema,forms-pipeline,member-diagnosis}.ts`, `apps/api/src/index.ts`, `apps/web/app/(admin)/admin/sync-status/page.tsx`, `apps/web/src/features/admin/diagnostics/{types,api}.ts`, `apps/web/src/features/admin/components/_members/{MemberDiagnosticsPanel,MemberDrawer}.tsx` |
| tests | `apps/api/src/diagnostics/{forms-pipeline.spec,forms-pipeline.contract.spec,member-diagnosis.contract.spec}.ts`, `apps/web/playwright/tests/admin/sync-status.spec.ts` |
| system specs | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md`, `docs/00-getting-started-manual/specs/11-admin-management.md` |
| Phase 12 | strict 7 files present under `outputs/phase-12/`; root/output artifacts parity maintained |
| user gate | staging deploy, authenticated `/admin/sync-status` screenshot, member drawer screenshot, Spec-B issue filing, commit, push, PR |
| follow-up execution | H2 identity rebuild is now implemented locally by `docs/30-workflows/completed-tasks/google-form-reflection-diagnostics-fu-002-h2-identity-rebuild/`; see `.claude/skills/aiworkflow-requirements/references/workflow-google-form-reflection-diagnostics-fu-002-h2-identity-rebuild-artifact-inventory.md` |
| unassigned tasks | `docs/30-workflows/unassigned-task/google-form-reflection-diagnostics-followup-{001,003,004}-{h1-ingest-recovery,h3-public-filter-ux,h4-schema-alias-backfill}.md` remain Spec-B repair candidates. Former H2 candidate is consumed by the local implementation workflow above. |

## Skill knowledge synced

| 観点 | 場所 |
| --- | --- |
| lessons-learned | `references/lessons-learned-google-form-reflection-diagnostics-2026-05.md`（L-GFRD-001〜008, OP-GFRD-1〜2） |
| lessons-learned hub | `references/lessons-learned.md` 仕様書インデックス先頭行 |
| changelog | `SKILL.md` / `SKILL-changelog.md` `v2026.05.26-google-form-reflection-diagnostics`、`changelog/20260526-google-form-reflection-diagnostics.md` |
| indexes | `indexes/{topic-map,quick-reference,resource-map,keywords.json}` 同 wave 反映 |
| task-workflow | `references/task-workflow-active.md` google-form-reflection-diagnostics ブロック |
| API endpoint | `references/api-endpoints.md` `GET /admin/diagnostics/forms-pipeline` / `GET /admin/diagnostics/member/:memberId` |
| system spec | `docs/00-getting-started-manual/specs/11-admin-management.md` 診断 API 節 |
| H2 follow-up sync | `references/api-endpoints.md`, `references/database-schema.md`, `docs/00-getting-started-manual/specs/02-auth.md`, `indexes/{quick-reference,resource-map}`, `references/task-workflow-active.md`, `SKILL-changelog.md`, `LOGS/_legacy.md` |
