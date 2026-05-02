# Skill Feedback Report

## Routing

| symptom | cause | recurrence condition | 5-minute resolution | evidence path | promoted-to |
| --- | --- | --- | --- | --- | --- |
| `metadata.scope` missing | New workflow root was created from a follow-up without full Phase 1 metadata | promoted unassigned follow-up becomes workflow root | add scope to root artifacts and Phase 1 metadata | `artifacts.json`, `phase-01.md` | no-op: covered by existing task-specification-creator Phase 1 rule |
| Phase 12 outputs listed but missing | specification declared outputs before creating actual files | spec_created workflow closes Phase 12 | create the 7 canonical files before PASS | `outputs/phase-12/` | no-op: covered by strict filename table |
| Direct Cloudflare tail wording | shorthand leaked into scope wording | Cloudflare runtime smoke task | replace with `bash scripts/cf.sh` wording | `index.md`, `phase-07.md` | no-op: existing Cloudflare CLI rule applies |
| 09c blocker diff format was implicit | AC-6 named destination but not data shape | evidence gate controls downstream workflow | record `blocked|unblocked`, `reason`, `evidence_path`, `checked_at` | `phase-07.md` | no-op: task-local contract is sufficient |
| Phase 11 helper artifacts stayed pre-execution | `manual-test-result.md` and `discovered-issues.md` were created from templates and not synchronized after `main.md` moved to BLOCKED | VISUAL_ON_EXECUTION smoke ends PASS/BLOCKED/FAIL after helper files were precreated | update helper artifacts in the same wave as Phase 11 main and Phase 12 compliance | `outputs/phase-11/manual-test-result.md`, `outputs/phase-11/discovered-issues.md` | promote: task-specification-creator Phase 11/12 runtime helper sync rule |

## Result

One owning skill rule should be promoted: when Phase 11 `main.md` records an executed
PASS/BLOCKED/FAIL result, helper artifacts such as `manual-test-result.md` and
`discovered-issues.md` must be synchronized in the same wave before Phase 12 compliance can pass.
