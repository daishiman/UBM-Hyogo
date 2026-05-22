# task-spec-skill-compliance-check-ci-gate

## Metadata

| Field | Value |
| --- | --- |
| status | unassigned |
| priority | low |
| parent_task | `docs/30-workflows/issue-534-skill-workflow-state-guidance/` |
| source | Issue #534 Phase 12 |

## Scope

Add a CI gate that verifies changed workflow roots include
`outputs/phase-12/phase12-task-spec-compliance-check.md` and that the file uses
the canonical sections from
`.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md`.

## 苦戦箇所

The repository has multiple workflow classes, including spec-only roots and
implementation roots. The gate must not require runtime evidence for spec-only
tasks.

## リスクと対策

| Risk | Mitigation |
| --- | --- |
| CI blocks old historical workflow roots | Limit checks to changed roots in the PR diff. |
| Template becomes stale | Compare required section headings from the skill reference. |

## 検証方法

- Create pass/fail fixture roots.
- Run the CI script locally.
- Add the CI job in warning mode first if existing historical roots create noise.

## スコープ外

Changing Phase 12 strict 7 filenames.
