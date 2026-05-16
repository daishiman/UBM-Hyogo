# Link Checklist

| Source | Target | Check | Verdict |
| --- | --- | --- | --- |
| Parent workflow `index.md` | `runbooks/staging-secret-provisioning.md` | Parent in-scope/DoD links include staging runbook | completed |
| Parent workflow `index.md` | `runbooks/production-secret-provisioning.md` | Parent in-scope/DoD links include production runbook | completed |
| Parent workflow `index.md` | existing `runbooks/secret-provisioning.md` | Existing staging-runtime-smoke runbook remains linked as the third family member | completed |
| Source unassigned task | `docs/30-workflows/ci-secret-alignment-followup-002-staging-production-secret-runbook/` | Source status is `consumed_by_workflow` with canonical pointer | completed |
| Workflow root artifacts | `outputs/artifacts.json` | Root and output artifacts parse and carry matching phase status | completed |
| aiworkflow quick-reference | staging/production runbooks | Quick lookup row points to both canonical runbooks | completed |
| aiworkflow resource-map | followup-002 workflow + runbooks | Resource map has dedicated row for this runbook sync | completed |
| aiworkflow task-workflow-active | followup-002 | Active workflow inventory records boundary and user gates | completed |
| aiworkflow deployment-secrets-management | followup-002 contract | System spec records Secret vs Variable split and user-gated mutation boundary | completed |
| aiworkflow changelog | `changelog/20260514-ci-secret-alignment-followup-002-staging-production-secret-runbook.md` | Same-wave changelog records runbook and stdin contract correction | completed |
| aiworkflow generated indexes | `indexes/topic-map.md` / `indexes/keywords.json` | Regenerated after reference updates | completed |
| SKILL history | `SKILL-changelog.md` | New history row records this sync | completed |
