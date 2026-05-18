# Workflow Artifact Inventory: UT-07C-FU-001 attendance CSV import

## Metadata

| Item | Value |
| --- | --- |
| workflow root | `docs/30-workflows/ut-07c-followup-001-attendance-csv-import/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval` |
| issue | `#312` |
| synced at | `2026-05-18` |

## Canonical Files

| Path | Role |
| --- | --- |
| `docs/30-workflows/ut-07c-followup-001-attendance-csv-import/index.md` | Workflow overview and acceptance criteria |
| `docs/30-workflows/ut-07c-followup-001-attendance-csv-import/artifacts.json` | Root artifact ledger |
| `docs/30-workflows/ut-07c-followup-001-attendance-csv-import/outputs/artifacts.json` | Output mirror of root artifact ledger |
| `docs/30-workflows/ut-07c-followup-001-attendance-csv-import/phase-01.md` - `phase-13.md` | Phase 1-13 task specifications |

## Implementation Targets

| Path | Role |
| --- | --- |
| `apps/api/src/routes/admin/attendance.ts` | Add route-local `POST /meetings/:sessionId/attendance/import` |
| `apps/api/src/use-cases/admin/import-attendance-bulk.ts` | Bulk import service |
| `apps/api/src/repository/attendance.ts` | Existing attendance repository plus `listExistingAttendanceMemberIds(c, sessionId)` |
| `apps/web/app/(admin)/admin/meetings/[id]/AttendanceCsvImportPanel.tsx` | Upload -> preview -> confirm wizard |
| `apps/web/src/lib/csv/parse-attendance.ts` | Client-side CSV parser wrapper |
| `apps/web/package.json` | `papaparse` dependency |

## Contract Summary

- Public API: `POST /admin/meetings/:sessionId/attendance/import?dryRun=true|false`.
- Payload: JSON rows produced by client-side CSV parse.
- Maximum rows: 500; 501+ rows return 413 before zod parse failure handling.
- Row statuses: `ok`, `duplicate`, `deleted_member`, `unknown_member`, `invalid`.
- `memberId` and `email` mismatch is `invalid` with `memberId_email_mismatch`.
- `dryRun=false` explicit only commits; omitted / typo dry-runs.
- Same-payload duplicate member is `duplicate` with `duplicate_in_payload`.
- Service layer receives explicit `DbCtx`, actor, and `auditLogProvider`; Hono `Context` is route-owned.
- Deleted-member classification uses `member_status.is_deleted`.
- Commit uses D1 batch to insert `member_attendance` and `audit_log.action='attendance.import.add'` in the same boundary.

## Evidence Boundary

Focused API route 13 / API service 13 / web parser+UI 13 PASS. Phase 11 local Playwright screenshots S1-S4 are captured with sha256 metadata. Phase 12 strict 7 outputs and root/outputs artifacts parity are present. Commit, push, and PR require user approval.

## Related Lessons

- [[lessons-learned-ut-07c-followup-001-attendance-csv-import-2026-05]] (L-UT07CFU1-001..008): contract.spec の vitest.d1 config 経由実行、D1 batch + audit 同一境界、client papaparse + JSON、`exactOptionalPropertyTypes` boundary、React 19 `JSX.Element` 名前空間、3-step wizard confirm 有効化条件、`dryRun` 安全側既定、`normalizeEmail` (NFKC + trim + lowercase) lookup。
