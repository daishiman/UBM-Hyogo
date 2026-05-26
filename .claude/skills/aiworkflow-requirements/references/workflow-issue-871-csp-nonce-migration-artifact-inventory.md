# Workflow Artifact Inventory: issue-871-csp-nonce-migration

## Metadata

| Field | Value |
| --- | --- |
| workflow | `docs/30-workflows/completed-tasks/issue-871-csp-nonce-migration/` |
| issue | #871 |
| status | `implemented_local_evidence_captured` |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL` |
| boundary | staging/production verification, commit, push, PR are user-gated |

## Implementation

| Path | Role |
| --- | --- |
| `apps/web/src/lib/security-headers.ts` | CSP builder nonce support |
| `apps/web/middleware.ts` | request nonce generation and request/response CSP propagation |
| `apps/web/src/lib/security-headers.spec.ts` | focused CSP builder tests |
| `apps/web/__tests__/middleware.spec.ts` | focused middleware nonce tests |
| `apps/web/playwright/tests/security-headers.spec.ts` | HTTP smoke expectations |

## Evidence

| Path | Status |
| --- | --- |
| `docs/30-workflows/completed-tasks/issue-871-csp-nonce-migration/outputs/phase-11/canonical-paths.json` | present |
| `docs/30-workflows/completed-tasks/issue-871-csp-nonce-migration/outputs/phase-11/evidence/vitest-focused.log` | PASS summary |
| `docs/30-workflows/completed-tasks/issue-871-csp-nonce-migration/outputs/phase-11/evidence/unsafe-inline-grep.txt` | PASS summary |
| `docs/30-workflows/completed-tasks/issue-871-csp-nonce-migration/outputs/phase-11/evidence/playwright-security-headers.log` | PASS summary |
| `docs/30-workflows/completed-tasks/issue-871-csp-nonce-migration/outputs/phase-12/phase12-task-spec-compliance-check.md` | PASS |

## Contract

`script-src` uses nonce + `strict-dynamic`. `style-src` / `style-src-elem` use nonce. Existing attribute styles are isolated behind `style-src-attr` as a transitional compatibility boundary. Report-only mode is unchanged.
