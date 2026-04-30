# Phase 11 Output: NON_VISUAL Walkthrough

## Evidence Mode

`visualEvidence` is `NON_VISUAL`. Screenshots are not created because the task is GitHub REST API governance, not browser UI.

## Required Evidence

| File | Role |
| --- | --- |
| `outputs/phase-11/manual-verification-log.md` | Manual NON_VISUAL verification plan |
| `outputs/phase-11/manual-smoke-log.md` | Pre-approval smoke checklist for ledger parity and screenshot absence |
| `outputs/phase-13/branch-protection-current-{dev,main}.json` | Runtime pre-apply GET evidence generated only after approval |
| `outputs/phase-13/branch-protection-applied-{dev,main}.json` | Runtime post-apply GET evidence generated only after approval |

## Alternative Evidence Gap Table

| Evidence | Guarantees | Does not guarantee before Phase 13 approval |
| --- | --- | --- |
| `artifacts.json` parity | Root and outputs ledgers point to the same NON_VISUAL workflow outputs | Real GitHub branch protection state |
| `manual-smoke-log.md` | Screenshots are intentionally absent and the task has no browser UI target | GET / PUT success |
| `manual-verification-log.md` | The command evidence plan and approval boundary are explicit | Applied contexts match expected contexts |
| Phase 13 JSON paths | Runtime evidence locations are reserved and named consistently | The files are successful evidence while `status=blocked_until_user_approval` |

Phase 13 JSON files are placeholders or templates until explicit user approval. They must not be cited as AC-3, AC-5, or AC-6 runtime evidence until they are regenerated from real `gh api` GET / PUT responses.
