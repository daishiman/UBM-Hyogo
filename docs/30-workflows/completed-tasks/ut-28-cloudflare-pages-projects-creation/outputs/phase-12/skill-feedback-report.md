# Skill Feedback Report

| Viewpoint | Feedback | Improvement Proposal | Disposition |
| --- | --- | --- | --- |
| Template | NON_VISUAL implementation tasks need required output existence checks, not just phase text validation. | Extend Phase 11/12 validators to fail when files listed in phase text are absent. | Linked to `task-phase11-nonvisual-evidence-template-sync.md`. |
| Workflow | State vocabulary can drift between `spec_created`, phase `pending`, and post-apply evidence. | Add a status matrix: workflow root / phase status / evidence execution status. | Applied locally in UT-28 docs and linked to skill feedback task. |
| Documentation | OpenNext Pages form vs Workers form is easy to blur. | Add a standard deployment-form preflight block to Cloudflare workflow specs. | Applied to aiworkflow deployment docs; deeper migration stays in `task-impl-opennext-workers-migration-001.md`. |
| Validator | Existing validation passed while `handoff-to-ut27.md` was missing. | Scan phase bodies for `outputs/...` paths and verify existence, not only artifacts-listed outputs. | Linked to skill feedback task. |

## Same-Wave Action

UT-28 updates its own Phase 10/12 outputs and aiworkflow requirements now. Changes to `task-specification-creator` templates and validators are not patched in this wave because they affect the shared skill contract; the existing feedback task remains the safer owner.
