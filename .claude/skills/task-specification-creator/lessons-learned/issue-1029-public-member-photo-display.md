# issue-1029 public member photo display

## Summary

When a public-facing task extends an already-landed private/admin asset, lock upstream anchors early and keep provider runtime capture separate from local implementation evidence.

## Reusable rules

| Rule | Application |
| --- | --- |
| upstream anchor table | Phase 1 records parent workflow, reused code paths, and unchanged ownership boundaries |
| optional resolver DI | Provider-dependent optional fields do not force provider setup into use-case tests |
| batch helper first | List responses must avoid N+1 photo metadata lookup |
| visual gate split | Local screenshots can be `present` while real provider URL capture remains user-gated |

## Evidence

- Workflow: `docs/30-workflows/completed-tasks/issue-1029-public-member-photo-display/`
- Phase 1 anchor: `outputs/phase-1/spec-extraction-map.md`
- Phase 11 evidence: `outputs/phase-11/evidence/`
- Phase 12 feedback: `outputs/phase-12/skill-feedback-report.md`
