# Skill Feedback Report

## テンプレ改善

No owning skill change is required. The failure was workflow-local: implementation files entered the wave while Phase 12 still claimed `spec_created / Code none`.

## ワークフロー改善

- Close keywords must not be used when the source issue is already CLOSED. The workflow now uses `Refs #630`.
- `signSessionJwt` examples in task specs must be checked against `packages/shared/src/auth.ts` before being copied into Phase 4.
- Dependency assumptions such as `tsx` must be verified against the target `package.json`.
- When `pnpm --filter <pkg> exec` is used, LHCI `puppeteerScript`, outputDir, and generated storage paths must be checked against the package cwd, not the repository root.
- Server Component pages measured by LHCI must have a deterministic backend/mock path, because browser cookie injection alone does not satisfy server-side `fetch()` dependencies.

## ドキュメント改善

The aiworkflow requirements indexes and task workflow ledger were synchronized in the same wave so the implemented-local/runtime-pending workflow is discoverable.

## Promotion Decision

No `.claude/skills/task-specification-creator/` or `.claude/skills/aiworkflow-requirements/` rule change is needed because existing rules already caught the defects.
