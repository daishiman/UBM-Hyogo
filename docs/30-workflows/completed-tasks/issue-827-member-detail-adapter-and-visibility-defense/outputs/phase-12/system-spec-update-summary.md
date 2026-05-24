# System Spec Update Summary

## Updated Specs

- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-issue-827-member-detail-adapter-and-visibility-defense-artifact-inventory.md`
- `.claude/skills/aiworkflow-requirements/changelog/20260523-issue827-member-detail-adapter-and-visibility-defense.md`

## Contract

Public member detail has a web-side pure adapter that performs defense-in-depth filtering before presentation:

- visibility allowlist: `public` for both `detailSections` and `allSections` passed to `MemberLinks` / `MemberActivity`
- detail field kind allowlist: `shortText`, `paragraph`, `date`, `radio`, `checkbox`, `dropdown`
- excluded from detail sections: `url`, `consent`, `system`, `unknown`, and `activity` section

API surface, shared Zod schemas, D1 schema, visual layout, and primitive signatures are unchanged.
