# System Spec Update Summary

## Step 1-A: Current Facts

- `POST /internal/alert-relay` HTTP response contract is unchanged.
- `ALERT_DEDUP_KV.get` failure now fails open after emitting structured JSON.
- `ALERT_DEDUP_KV.put` failure keeps `{ ok: true, attempts, dedupPersisted: false }` and emits structured JSON.
- `dedupeKey` raw value is not logged.

## Step 1-B: aiworkflow-requirements Sync

Updated in this wave:

- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/keywords.json`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-ut-17-followup-005-alert-relay-kv-operation-error-metrics-artifact-inventory.md`
- `.claude/skills/aiworkflow-requirements/changelog/20260516-ut17-followup-005-alert-relay-kv-op-metrics.md`

Index regeneration:

- Command: `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js --quiet`
- Result: PASS with Node module-type warning only.
- Effect: `topic-map.md` now lists the UT-17-FU-005 artifact inventory, and `keywords.json` references the new inventory under generated search terms.

## Step 1-C: Runtime Boundary

Runtime Workers Logs evidence requires deploy and `bash scripts/cf.sh tail ...`; this remains Phase 13/user-gated.
