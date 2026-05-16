# Documentation Changelog

## 2026-05-15

### コード（apps/web）

- 新規: `apps/web/src/features/admin/hooks/useAdminMutation.ts`
- 新規: `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.tsx`
- 新規: `apps/web/src/features/admin/hooks/index.ts`
- 新規: `apps/web/src/components/ui/Toast.spec.tsx`
- 編集: `apps/web/src/components/ui/Toast.tsx`（variant 引数追加、`aria-live="assertive"` 領域追加、optional toast context 追加）
- 編集: `apps/web/src/lib/url/safe-redirect.ts`（`/login?...` redirect loop fallback 追加）
- 編集: `apps/web/src/lib/url/login-redirect.spec.ts`（AC-4 追加ケース）

### 仕様 / docs

- 編集: `docs/00-getting-started-manual/specs/02-auth.md`（「Client 401 / 403 ハンドリング」セクション追加）
- 編集: `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- 編集: `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- 編集: `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`

### Workflow outputs

- 新規: `docs/30-workflows/parallel-10-auth-session-handling/outputs/phase-01/requirements.md`
- 新規: `docs/30-workflows/parallel-10-auth-session-handling/outputs/phase-02/{auth-session-policy,hook-design,toast-extension-design,error-handling-matrix}.md`
- 新規: `docs/30-workflows/parallel-10-auth-session-handling/outputs/phase-03/design-review.md`
- 新規: `docs/30-workflows/parallel-10-auth-session-handling/outputs/phase-04/{task-breakdown,critical-path}.md`
- 新規: `docs/30-workflows/parallel-10-auth-session-handling/outputs/phase-05/implementation-plan.md`
- 新規: `docs/30-workflows/parallel-10-auth-session-handling/outputs/phase-06/implementation-steps.md`
- 新規: `docs/30-workflows/parallel-10-auth-session-handling/outputs/phase-07/test-plan.md`
- 新規: `docs/30-workflows/parallel-10-auth-session-handling/outputs/phase-08/docs-updates.md`
- 新規: `docs/30-workflows/parallel-10-auth-session-handling/outputs/phase-09/acceptance.md`
- 新規: `docs/30-workflows/parallel-10-auth-session-handling/outputs/phase-10/refactor-summary.md`
- 新規: `docs/30-workflows/parallel-10-auth-session-handling/outputs/phase-11/evidence/{typecheck,lint,test,build}.txt`（tracked evidence mirror）
- 参考: `docs/30-workflows/parallel-10-auth-session-handling/outputs/phase-11/evidence/{typecheck,lint,test,build}.log`（raw local log; `.gitignore` 対象）
- 新規: `docs/30-workflows/parallel-10-auth-session-handling/outputs/phase-11/visual-verification-skip.md`
- 更新: `docs/30-workflows/parallel-10-auth-session-handling/outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md`
