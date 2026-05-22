# 2026-05-10 task-17 admin schema-conflicts-audit spec sync

task-17 admin schema/conflicts/audit を `implemented-local / implementation / VISUAL_ON_EXECUTION / local_visual_evidence_pass` として同期した。

主な同期内容:

- workflow root: `docs/30-workflows/completed-tasks/task-17-admin-schema-conflicts-audit/`
- implementation mode: `existing-admin-contract-hardening-with-e2e-fixture-fix`
- current route 正本: `apps/web/app/(admin)/admin/{schema,identity-conflicts,audit}/page.tsx`
- current component 正本: `apps/web/src/components/admin/{SchemaDiffPanel,IdentityConflictRow,AuditLogPanel}.tsx`
- current helper 正本: `apps/web/src/lib/admin/{api,server-fetch}.ts`
- API 境界: 既存 `apps/api/src/routes/admin/{schema,sync-schema,identity-conflicts,audit}.ts` のみ。新 endpoint / D1 schema 追加なし
- Phase 11 10 screenshots, Phase 12 strict 7 outputs と root/output artifacts parity を追加

Runtime screenshot / axe / staging smoke / commit / push / PR は user-gated。

## Close-out follow-up (2026-05-10 同日)

- Phase 13 完了に伴い workflow root を `docs/30-workflows/completed-tasks/task-17-admin-schema-conflicts-audit/` に移動。
- skill 群（resource-map / quick-reference / task-workflow-active / artifact-inventory / changelog / LOGS）の path 参照を新 canonical に一括更新。
- `references/lessons-learned-task-17-admin-schema-conflicts-audit-2026-05.md` を新規作成し、以下を記録:
  - L-TASK17-001 SSR Component fetch には `PLAYWRIGHT_TASK17_ADMIN_FIXTURE` env-gated server-side fixture が必須（browser `page.route()` 不可）。
  - L-TASK17-002 `artifacts.json` の root/outputs 二元化 drift 解消は既存 `docs/30-workflows/unassigned-task/TASK-SPEC-PHASE-FILENAME-DETECTION-001.md` に委譲（duplicate followup 起票せず）。
  - L-TASK17-003 `new` 前提で task spec を起こす前に worktree 上 `apps/web/app/<route>` / `apps/web/src/components/**` / `apps/web/src/lib/**` を grep し、ヒット時は `existing-*-hardening` に再分類（task-specification-creator phase-1 inventory gate に従う）。
  - L-TASK17-004 Playwright config レベルでの `AUTH_SECRET` override は同 worker の他 admin fixture cookie を一斉 invalid 化するため禁止。

