# System Spec Update Summary

## Updated Spec

- `docs/00-getting-started-manual/specs/02-auth.md`
- `.claude/skills/aiworkflow-requirements/references/api-endpoints.md`
- `.claude/skills/aiworkflow-requirements/references/database-schema.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-google-form-reflection-diagnostics-fu-002-h2-identity-rebuild-artifact-inventory.md`

## Summary

The auth spec now documents H2 identity auto-link behavior for `/auth/session-resolve`.
It defines lowercase email normalization, first/current response selection, bridge-backed member id reuse, bridge-less `autolink:<uuid>` creation, and the rule that status gates are not bypassed.
The aiworkflow-requirements canonical ledgers now register the child implementation workflow, the consumed H2 follow-up boundary, the auth API contract, and the D1 schema recovery rule.

## Same-Wave Consistency

The task spec was corrected to remove the invalid assumption that `member_responses.member_id` exists.
The implementation and documentation now use the same source of truth: `member_responses.response_email` for matching and `tag_assignment_queue` as the only existing member id bridge.
