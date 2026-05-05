# Unassigned Task Detection

## Baseline

The following are related baseline tasks and are not newly counted by UT-28:

| Task | Reason |
| --- | --- |
| 01b | Cloudflare account / token bootstrap. |
| UT-05 | CI/CD workflow implementation and deploy output form. |
| UT-27 | GitHub Secrets / Variables placement. |
| UT-06 | Production deployment execution. |
| UT-16 | Custom domain binding. |
| UT-29 | Post-CD smoke. |
| UT-25 | Cloudflare service account / secret placement. |

## Current Findings

| Finding | Disposition | Existing task |
| --- | --- | --- |
| OpenNext output-form mismatch (`.next` remains while OpenNext Workers contract expects `.open-next/assets` + `_worker.js`) | Do not create a duplicate task. Treat as a UT-05 / OpenNext migration blocker and link explicitly. | `docs/30-workflows/unassigned-task/task-impl-opennext-workers-migration-001.md`, `docs/30-workflows/unassigned-task/UT-GOV-006-web-deploy-target-canonical-sync.md` |
| Workflow topology / deploy target drift | Existing drift cleanup task covers workflow/spec mismatch. | `docs/30-workflows/unassigned-task/ut-cicd-workflow-topology-drift-001.md` |
| NON_VISUAL Phase 11 placeholder vs executed evidence ambiguity | Existing skill feedback task covers the core template issue; UT-28 adds concrete validator feedback. | `docs/30-workflows/unassigned-task/task-phase11-nonvisual-evidence-template-sync.md` |
| Skill validator should check required output files and status vocabulary matrix | Extend existing skill feedback rather than create a duplicate. | `docs/30-workflows/unassigned-task/task-phase11-nonvisual-evidence-template-sync.md` |
| Terraform Cloudflare Provider adoption | Future IaC candidate, not a blocker for UT-28. | No new task; keep as low-priority future evaluation. |
| Separate Cloudflare tokens per environment | UT-27 decision point. | `docs/30-workflows/unassigned-task/UT-27-github-secrets-variables-deployment.md` |

## Four Design-Task Pattern Check

| Pattern | Check | Result |
| --- | --- | --- |
| Existing task can absorb finding | OpenNext, workflow topology, and NON_VISUAL template findings match existing tasks. | PASS |
| New task required | No finding requires a new independent task because existing backlog entries own the risk. | PASS |
| Too large for current wave | Terraform/IaC remains future scope and is intentionally not pulled into UT-28. | PASS |
| Current task must fix now | Canonical docs and UT-28 outputs are fixed in this wave; Cloudflare mutation remains Phase 13 gated. | PASS |

## Conclusion

New unassigned task count: 0. UT-28 closes by linking and updating existing backlog items rather than creating duplicates.
