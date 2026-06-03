# 2026-06-01 issue-1030 member photo variant spec sync

`issue-1030-member-photo-transcode-resize-variant-pipeline` を `implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION` として同期した。

- workflow root: `docs/30-workflows/issue-1030-member-photo-transcode-resize-variant-pipeline/`
- status: `implemented_local_runtime_pending`（workflow artifacts では `implementation_reviewed_local`。親 #983 と同階層 `docs/30-workflows/` 直下に配置・completed-tasks 未移動）
- contract: client-side Canvas display/thumb generation, dual R2 keys, `member_photos` variant metadata, optional `photoThumbUrl`, admin avatar thumb consumption
- 2026-06-01 implementation review addendum: local code implementation is now present in `apps/`, `packages/`, and `apps/api/migrations/`; remote D1 apply, staging deploy, authenticated screenshots, commit, push, PR, and Issue #1030 mutation remain user-gated
- inventory: `.claude/skills/aiworkflow-requirements/references/workflow-issue-1030-member-photo-transcode-resize-variant-pipeline-artifact-inventory.md`

Same-wave correction: Phase 4/6/7/8/9/10 output files were materialized so root phase specs, Phase 12 compliance, and physical artifacts no longer drift.

2026-06-01 impl-spec-to-skill-sync addendum:
- lessons-learned 新規: `lessons-learned/lessons-learned-issue-1030-member-photo-variant-pipeline-2026-05.md`（L-I1030-001..008）。inventory に `## Lessons` 節を追加。
- path drift 補正: 検証中に mover が `completed-tasks/issue-1030-...` へ移動＋全参照を書き換えたため、workflow dir を `docs/30-workflows/` 直下へ復元し、artifacts.json×2 / compliance-check / 本 changelog / task-workflow-active / inventory / quick-reference / resource-map の completed-tasks 参照を非 completed-tasks に正規化。
- gate-metadata 補正: Gate-B `status` を enum 外の `passed_local` から `passed` へ正規化（local nuance は notes 保持）。
- status drift 補正: index.md / compliance-check の `spec_created` 表記を `implementation_reviewed_local` と per-phase status（implemented/verified/passed/updated_local）へ整合。
