# System spec update summary

## Updated specs

| Path | Update |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | Added binding-policy drift gate command, mapping table, current baseline, and responsibility boundary |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | Added issue #1056 quick reference |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | Added issue #1056 resource-map row |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Added active workflow ledger entry |
| `.claude/skills/aiworkflow-requirements/references/workflow-issue-1056-kv-alert-policy-binding-drift-detection-artifact-inventory.md` | Added artifact inventory |

## New surfaces

- `BindingPolicyDrift`
- `parseActiveBindings`
- `loadActiveBindings`
- `buildBindingPolicyDrift`
- `BINDING_POLICY_MAP`
- `cf.sh alerts binding-drift`
- `pnpm cf:alerts:binding-drift`
