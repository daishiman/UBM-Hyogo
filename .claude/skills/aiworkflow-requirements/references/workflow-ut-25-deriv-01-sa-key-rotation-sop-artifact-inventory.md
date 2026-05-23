# Workflow Artifact Inventory: UT-25-DERIV-01 SA Key Rotation SOP

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/ut-25-deriv-01-sa-key-rotation-sop/` |
| source stub (consumed) | `docs/30-workflows/completed-tasks/UT-25-DERIV-01-sa-key-rotation-sop.md` |
| helper | `scripts/cf-rotate-sa-key.sh` |
| tests | `scripts/__tests__/cf-rotate-sa-key.bats` |
| SOP | `docs/30-workflows/runbooks/sa-key-rotation-sop.md` |
| record template | `docs/30-workflows/runbooks/sa-key-rotation-records/TEMPLATE.md` |
| Phase 11 evidence | `docs/30-workflows/completed-tasks/ut-25-deriv-01-sa-key-rotation-sop/outputs/phase-11/` |
| Phase 12 strict 7 | `docs/30-workflows/completed-tasks/ut-25-deriv-01-sa-key-rotation-sop/outputs/phase-12/` |
| skill changelog | `.claude/skills/aiworkflow-requirements/changelog/20260522-ut-25-deriv-01-sa-key-rotation-sop.md` |
| lessons-learned | `.claude/skills/aiworkflow-requirements/references/lessons-learned-ut-25-deriv-01-sa-key-rotation-2026-05.md` (L-UT25SAK-001..007) |
| deployment back-link | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` §関連 SOP |
| workflow log row | `docs/30-workflows/LOGS.md` (2026-05-22) |

Status: `implemented_local_evidence_captured / implementation / NON_VISUAL / Phase 13 pending_user_approval`.
Cloudflare Secret mutation, Google IAM disable/delete, UT-26 runtime smoke, commit, push, and PR are user-gated.
