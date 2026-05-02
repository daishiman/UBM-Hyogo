# aiworkflow-requirements update plan

## Files to synchronize

- `.claude/skills/aiworkflow-requirements/references/legacy-ordinal-family-register.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- Generated indexes under `.claude/skills/aiworkflow-requirements/indexes/`

## Update rule

All 08a path and status references must resolve to one current interpretation: restored canonical root, completed successor, or current/partial with a formal restore task. Mixed interpretations are not allowed.

## Verification

Run path grep, broken-link grep, and index rebuild verification after the references are edited.
