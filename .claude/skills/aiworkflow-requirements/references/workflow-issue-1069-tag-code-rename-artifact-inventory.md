# Artifact Inventory — issue-1069-tag-code-rename

## Summary

`issue-1069-tag-code-rename` is an `implemented_local_evidence_captured / implementation / NON_VISUAL` workflow. It supersedes the issue-1035 `code immutable` design point and allows admin tag master `code` rename through existing `PATCH /admin/tags/:tagId` with `expectedCode` optimistic CAS, split 409 errors, and dedicated audit action `admin.tag.code_renamed`.

Issue #1069 was closed externally on 2026-06-03; this workflow performed no Issue mutation. Commit, push, PR, staging runtime smoke, and Issue mutation are user-gated.

## Workflow Artifacts

- `docs/30-workflows/completed-tasks/issue-1069-tag-code-rename/index.md`
- `docs/30-workflows/completed-tasks/issue-1069-tag-code-rename/artifacts.json`
- `docs/30-workflows/completed-tasks/issue-1069-tag-code-rename/outputs/artifacts.json`
- `docs/30-workflows/completed-tasks/issue-1069-tag-code-rename/outputs/phase-11/manual-test-result.md`
- `docs/30-workflows/completed-tasks/issue-1069-tag-code-rename/outputs/phase-11/main.md`
- `docs/30-workflows/completed-tasks/issue-1069-tag-code-rename/outputs/phase-12/phase12-task-spec-compliance-check.md`

## Implementation Targets

- `apps/api/src/repository/tagDefinitions.ts`
- `apps/api/src/routes/admin/tags.ts`
- `docs/00-getting-started-manual/specs/01-api-schema.md`
- `apps/api/src/repository/_shared/generated/static-manifest.json`

## Test Targets

- `apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts`
- `apps/api/src/routes/admin/tags.contract.spec.ts`
- `apps/api/src/routes/admin/members.tags.contract.spec.ts`
- `apps/api/src/repository/__tests__/auditLog.repository.spec.ts`

## Evidence

- Focused D1 Vitest: 4 files / 37 tests PASS
- `mise exec -- pnpm --filter @ubm-hyogo/api typecheck`: PASS
- `mise exec -- pnpm lint`: PASS
- `mise exec -- pnpm verify:static-manifest`: PASS after deterministic regeneration

## Contract

- `UpdateTagDefinitionInput`: `code?`, `label?`, `category?`, `expectedCode?`
- `UpdateTagDefinitionResult`: `{ok:true,row}` / `not_found` / `code_conflict` / `missing_expected_code` / `stale`
- HTTP errors: 400 `invalid_body` for code without expectedCode, 404 `tag_not_found`, 409 `tag_code_conflict`, 409 `tag_stale_conflict`
- audit action: `admin.tag.code_renamed` with before/after `{code}`
- no D1 schema migration
- no apps/web change in this workflow

## Follow-ups

- `docs/30-workflows/unassigned-task/task-issue-1069-followup-001-admin-tag-code-edit-ui.md`
- Source consumed: `docs/30-workflows/completed-tasks/task-issue-1035-followup-002-tag-code-rename-requirements.md`
