# Phase 4 Output: Validation Matrix

| Check | Command | Expected |
| --- | --- | --- |
| dev contexts array | `jq -e '.required_status_checks.contexts | type == "array"' docs/30-workflows/completed-tasks/task-utgov001-references-reflect-001/outputs/phase-13/branch-protection-applied-dev.json` | PASS after fresh GET |
| main contexts array | `jq -e '.required_status_checks.contexts | type == "array"' docs/30-workflows/completed-tasks/task-utgov001-references-reflect-001/outputs/phase-13/branch-protection-applied-main.json` | PASS after fresh GET |
| dev not placeholder | `jq -e '.status != "blocked_until_user_approval"' docs/30-workflows/completed-tasks/task-utgov001-references-reflect-001/outputs/phase-13/branch-protection-applied-dev.json` | PASS after fresh GET |
| main not placeholder | `jq -e '.status != "blocked_until_user_approval"' docs/30-workflows/completed-tasks/task-utgov001-references-reflect-001/outputs/phase-13/branch-protection-applied-main.json` | PASS after fresh GET |
| no Closes | `rg -n "Closes #303" docs/30-workflows/completed-tasks/task-utgov001-references-reflect-001 || true` | no matches |
| Phase 12 seven outputs | `test -f outputs/phase-12/main.md && find outputs/phase-12 -maxdepth 1 -type f | wc -l` | 7 files |
| index generation | `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` | exit 0 |
| mirror | `diff -qr .claude/skills/aiworkflow-requirements .agents/skills/aiworkflow-requirements` | reviewed |
