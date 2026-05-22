# 2026-05-08 Issue #554 audit-correlation required status check

- workflow root: `docs/30-workflows/issue-554-audit-correlation-branch-protection-required-check/`
- state: `spec_created / implementation / NON_VISUAL / CONTRACT_READY_IMPLEMENTATION_PENDING`
- required context: `audit-correlation-verify / verify`
- target branches: `dev`, `main`

## Added / updated

- `references/branch-protection.md` — branch protection invariant contract and Issue #554 runbook (References 節で workflow / inventory / parent / SSOT / lessons / changelog を相互リンク).
- `references/workflow-issue-554-audit-correlation-branch-protection-required-check-artifact-inventory.md` — workflow artifact inventory and reserved runtime evidence paths.
- `references/audit-correlation.md` — Issue #516 parent path を `completed-tasks/` 配下に正規化、References 節に Issue #554 downstream リンクと両 lessons-learned を追加.
- `references/workflow-issue-516-github-audit-log-cross-source-correlation-artifact-inventory.md` — Issue #554 を Downstream として登録.
- `indexes/quick-reference.md` — Issue #554 quick lookup.
- `indexes/resource-map.md` — Issue #554 resource selection row.
- `indexes/topic-map.md` / `indexes/keywords.json` — Issue #554 関連トピック登録.
- `references/task-workflow-active.md` — active workflow registration.
- `lessons-learned/lessons-learned-issue-554-branch-protection-required-check-2026-05.md` — L-554-001..004 (payload preservation / Phase 11 before/after split / canonical root drift / 4-point parent-child sync).
- `docs/30-workflows/issue-554-audit-correlation-branch-protection-required-check/outputs/phase-12/` — strict 7 outputs.
- `CLAUDE.md` — branch strategy note for `audit-correlation-verify / verify`.
- Issue #516 parent references normalized to `docs/30-workflows/completed-tasks/issue-516-github-audit-log-cross-source-correlation/`.
- Non-Phase-12 placeholder output files removed from Issue #554 so scaffold and evidence are not conflated.

## Boundary

GitHub branch protection PUT, fresh before/after JSON capture, commit, push, and PR creation are not executed in this wave. They require explicit user approval in Phase 13.
