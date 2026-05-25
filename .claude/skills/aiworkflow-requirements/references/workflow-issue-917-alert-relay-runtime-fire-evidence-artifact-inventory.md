# Workflow Artifact Inventory: issue-917 alert relay runtime fire evidence

| Field | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-917-alert-relay-runtime-fire-evidence/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL / runtime_observation` |
| issue | `Refs #917` only; issue is CLOSED |
| source | `docs/30-workflows/unassigned-task/UT-25-DERIV-02-FU-02-alert-relay-runtime-fire-evidence.md` |
| upstream | `docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/` |
| parent | `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/` |
| related | `docs/30-workflows/unassigned-task/ut-17-followup-001-alert-relay-runtime-smoke-evidence.md` |
| implementation | `apps/api/src/scheduled/sheets-auth-healthcheck.ts`, `apps/api/src/scheduled/sheets-auth-healthcheck.contract.spec.ts` |

## Workflow Artifacts

| Path | Purpose |
| --- | --- |
| `docs/30-workflows/completed-tasks/issue-917-alert-relay-runtime-fire-evidence/index.md` | Workflow entrypoint and status. |
| `docs/30-workflows/completed-tasks/issue-917-alert-relay-runtime-fire-evidence/artifacts.json` | Root metadata, gates, phase states. |
| `docs/30-workflows/completed-tasks/issue-917-alert-relay-runtime-fire-evidence/outputs/artifacts.json` | Output-side parity copy. |
| `docs/30-workflows/completed-tasks/issue-917-alert-relay-runtime-fire-evidence/phase-01-requirements.md` | Runtime evidence requirements and acceptance criteria. |
| `docs/30-workflows/completed-tasks/issue-917-alert-relay-runtime-fire-evidence/phase-05-implementation-guide.md` | User-gated execution runbook and redaction rules. |
| `docs/30-workflows/completed-tasks/issue-917-alert-relay-runtime-fire-evidence/phase-11-evidence-inventory.md` | NON_VISUAL evidence inventory with docs gate present and runtime evidence pending. |
| `docs/30-workflows/completed-tasks/issue-917-alert-relay-runtime-fire-evidence/outputs/phase-11/main.md` | Phase 11 local contract + docs gate summary. |
| `docs/30-workflows/completed-tasks/issue-917-alert-relay-runtime-fire-evidence/outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 strict 7 and four-condition verdict. |

## Phase 12 Strict 7

| Path | Purpose |
| --- | --- |
| `docs/30-workflows/completed-tasks/issue-917-alert-relay-runtime-fire-evidence/outputs/phase-12/main.md` | Phase 12 summary. |
| `docs/30-workflows/completed-tasks/issue-917-alert-relay-runtime-fire-evidence/outputs/phase-12/implementation-guide.md` | Execution guide summary. |
| `docs/30-workflows/completed-tasks/issue-917-alert-relay-runtime-fire-evidence/outputs/phase-12/system-spec-update-summary.md` | aiworkflow sync summary. |
| `docs/30-workflows/completed-tasks/issue-917-alert-relay-runtime-fire-evidence/outputs/phase-12/documentation-changelog.md` | Documentation change ledger. |
| `docs/30-workflows/completed-tasks/issue-917-alert-relay-runtime-fire-evidence/outputs/phase-12/unassigned-task-detection.md` | Unassigned task decision. |
| `docs/30-workflows/completed-tasks/issue-917-alert-relay-runtime-fire-evidence/outputs/phase-12/skill-feedback-report.md` | Skill feedback routing. |
| `docs/30-workflows/completed-tasks/issue-917-alert-relay-runtime-fire-evidence/outputs/phase-12/phase12-task-spec-compliance-check.md` | Compliance check. |

## User-Gated Runtime Boundary

| Pending item | Target |
| --- | --- |
| Cloudflare secret name presence | `bash scripts/cf.sh secret list --env staging` / production optional. |
| staging deploy and Workers tail | `bash scripts/cf.sh` only; no direct `wrangler`. |
| controlled SA key invalidation | Parent UT-25-DERIV-02 Phase 11 procedure. |
| runtime evidence MD | `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/outputs/phase-11/evidence/alert-relay-fire-staging.md`. |
| upstream back-reference | `docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/outputs/phase-12/implementation-guide.md`. |
| source consumed conversion | `docs/30-workflows/unassigned-task/UT-25-DERIV-02-FU-02-alert-relay-runtime-fire-evidence.md` after runtime evidence is captured. |

## Skill Knowledge Synced

| Path | Notes |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-917-alert-relay-runtime-fire-evidence-2026-05.md` | L-I917RUNTIME-001..004. |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | Quick lookup block. |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | Resource map row. |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Active workflow ledger entry. |
| `.claude/skills/aiworkflow-requirements/changelog/20260525-issue-917-alert-relay-runtime-fire-evidence.md` | Dated changelog. |
