# 2026-05-18 task-761 Phase 11 inventory header conformance reflection

- During `dev → feat/task-761-visual-full-required-check` sync-merge, pre-push `phase12-compliance-guard` blocked the push because task-761's Phase 12 compliance file used `Evidence | Verdict` columns. The parser at `scripts/lib/phase12-compliance/parse-phase11-evidence.ts` only recognises `Classification | Path | Status`.
- Resolution: rewrite the inventory in canonical form, with each row pointing to a real file under `outputs/phase-11/evidence/` and `Status=present` (lowercase).
- aiworkflow-requirements reflection: when archiving a completed-tasks workflow under `docs/30-workflows/completed-tasks/`, the closeout step must verify `pnpm verify:phase12-compliance` BEFORE attempting push, because the pre-push hook fails late and forces another sync cycle. This is restated here so future closeout waves preempt the failure mode rather than discovering it at push time.

See SSOT: `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md`.
