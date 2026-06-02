# issue-1059 public members fields batch fetch artifact inventory

## Workflow

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1059-public-members-fields-batch-fetch-n1-prevention/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| issue | #1059 OPEN（Issue mutation / close は user-gated） |
| source | `docs/30-workflows/completed-tasks/issue-224-followup-001-public-members-fields-batch-fetch-n1-prevention.md` |
| parent | issue #224 U-2 fields N+1 follow-up |

## Implementation

| path | change |
| --- | --- |
| `apps/api/src/repository/responseFields.ts` | `listFieldsByResponseIds(ctx, readonly ResponseId[])` を追加 |
| `apps/api/src/use-cases/public/list-public-members.ts` | per-member fields loop を batch query + `fieldsByResponseId` groupBy に置換、`as never` を `asResponseId` に置換 |
| `apps/api/src/use-cases/public/__tests__/helpers/public-d1.ts` | `response_id IN` dispatch を追加 |
| `apps/api/src/repository/__tests__/responseFields.repository.spec.ts` | batch helper spec を追加 |
| `apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts` | fields query count <= 1 regression spec を追加 |

## Evidence

| evidence | result |
| --- | --- |
| use-case focused Vitest | 10 tests PASS |
| repository focused Vitest | 5 tests PASS |
| Phase 11 | `outputs/phase-11/manual-test-result.md` |
| Phase 12 | strict 7 present, `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## Boundary

No D1 schema, endpoint, Google Form, tags logic, or `apps/web` change. Commit, push, PR, and Issue #1059 mutation are user-gated.

## Lessons

- [lessons-learned-issue-1059-public-members-fields-batch-fetch-n1-prevention-2026-06.md](lessons-learned-issue-1059-public-members-fields-batch-fetch-n1-prevention-2026-06.md) — L-I1059-001..008
