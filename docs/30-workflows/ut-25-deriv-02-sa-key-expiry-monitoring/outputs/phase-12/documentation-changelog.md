# Documentation Changelog

| Path | Change |
| --- | --- |
| `outputs/artifacts.json` | Added output artifact ledger for Phase 12 strict 7 parity. |
| `outputs/phase-11/manual-test-result.md` | Added spec-created Phase 11 placeholder with `n/a` status. |
| `outputs/phase-12/*.md` | Added canonical strict 7 Phase 12 outputs. |
| `phase-11-evidence-inventory.md` | Clarified pending/n/a status split for implementation vs user-gated runtime evidence. |
| `phase-12-compliance-check.md` | Replaced self-declared pass wording with strict heading-compatible compliance evidence. |
| `rollback-runbook.md` | Added sheets-auth alert entry note. |
| `aiworkflow-requirements` indexes/references | Registered workflow root, artifact inventory, changelog, and active task ledger entry. |
| `artifacts.json` / `outputs/artifacts.json` | Corrected workflow state from `spec_created` to `implemented_local_runtime_pending` after runtime code review. |
| `alert-relay.ts` / sheets-auth contract test | Corrected 10-minute suppression threshold so the 1st and 2nd alerts send and the 3rd+ is deduped. |
| `phase-06-test-strategy.md` | Aligned dedup wording with the DoD/NFR threshold (`3 件目以降`). |

No commit, push, PR, Cloudflare mutation, or staging/prod runtime operation was
performed.
