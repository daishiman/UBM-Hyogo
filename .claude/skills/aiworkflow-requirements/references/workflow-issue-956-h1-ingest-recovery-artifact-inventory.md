# Workflow Artifact Inventory — issue-956-h1-ingest-recovery

| Field | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-956-h1-ingest-recovery/` |
| status | `spec_created / docs-only / NON_VISUAL / runtime_pending_user_approval` |
| related issue | #956 CLOSED (`Refs #956` only) |
| parent workflow | `docs/30-workflows/completed-tasks/google-form-reflection-diagnostics/` |
| source proto-spec | `docs/30-workflows/completed-tasks/issue-956-h1-ingest-recovery/unassigned-task-specs/google-form-reflection-diagnostics-followup-001-h1-ingest-recovery.md` consumed |

## Required Artifacts

| Artifact | Status | Notes |
| --- | --- | --- |
| `index.md` | present | Runtime boundary and Phase index. |
| `phase-01` through `phase-13` | present | Canonical Phase 1-13 spec set. |
| `artifacts.json` | present | Root metadata and gates. |
| `outputs/artifacts.json` | present | Mirror metadata and gates. |
| `outputs/phase-11/phase-11.md` | present | Pending runtime evidence ledger. |
| `outputs/phase-12/main.md` | present | Summary and 30-method compact evidence. |
| `outputs/phase-12/implementation-guide.md` | present | Phase 12 guide. |
| `outputs/phase-12/system-spec-update-summary.md` | present | SSOT sync summary. |
| `outputs/phase-12/documentation-changelog.md` | present | Documentation changelog. |
| `outputs/phase-12/unassigned-task-detection.md` | present | 0 new tasks; source consumed. |
| `outputs/phase-12/skill-feedback-report.md` | present | Skill feedback report. |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | present | Final compliance check. |

## Runtime Evidence Pending User Approval

| Artifact | Status |
| --- | --- |
| `outputs/phase-11/snapshot-before.json` | pending_user_approval |
| `outputs/phase-11/cf-secret-list.txt` | pending_user_approval |
| `outputs/phase-11/wrangler-cron-grep.txt` | pending_user_approval |
| `outputs/phase-11/cron-tail.log` | pending_user_approval |
| `outputs/phase-11/stale-lock-select.txt` | pending_user_approval |
| `outputs/phase-11/stale-lock-reset.txt` | conditional |
| `outputs/phase-11/snapshot-after.json` | pending_user_approval |
| `outputs/phase-11/snapshot-diff.md` | pending_user_approval |

## Invariants

- Secret values, bearer tokens, PEM blocks, and service-account local parts must not be recorded.
- Runtime PASS requires AC-1..AC-6 evidence in Phase 11.
- Commit, push, PR, Cloudflare secret mutation, and production D1 updates are user-gated.

## Lessons Learned

詳細: `lessons-learned/lesson-20260527-issue956-h1-ingest-recovery.md`

| ID | 教訓 |
| --- | --- |
| L-I956-001 | closed issue + parent 実装済みでも runtime ops runbook は canonical workflow として独立化する（`implementationCategory: runtime-ops-runbook` / `implementation_files: []`）。 |
| L-I956-002 | runtime-dependent followup は Phase 12 detection 表で列挙したうえで `Not created — runtime evidence dependent` と decision を明記し、観測時 escalation 契約を併記する。 |
| L-I956-003 | source unassigned proto-spec は物理削除せず `status: consumed` + canonical pointer を frontmatter に追記して保持する。 |
| L-I956-004 | runtime PASS は AC-1..AC-6 物理 evidence（`snapshot-after.json` / `snapshot-diff.md`）出現まで claim 禁止。 |
| L-I956-005 | redaction 契約: secret 値 / token preview / SA local part / responder email / 回答本文は evidence に転写禁止（`<REDACTED>` 表記）。 |
