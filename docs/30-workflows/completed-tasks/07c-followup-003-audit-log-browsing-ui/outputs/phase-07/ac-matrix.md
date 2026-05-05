# Phase 7 AC Matrix

| AC | Status | Test / evidence |
| --- | --- | --- |
| AC-1 non-admin rejected | PASS | `apps/api/src/routes/admin/audit.test.ts` authz 401; Phase 11 forbidden screenshot |
| AC-2 action filter | PASS | repository/API tests for `attendance.add`; Phase 11 action-filter screenshot |
| AC-3 actor/target filters | PASS | repository/API tests for actorEmail / targetType / targetId |
| AC-4 JST input, UTC query, JST display | PASS | `page.test.ts`, API UTC ISO range test, `AuditLogPanel` JST formatter test |
| AC-5 JSON initially collapsed | PASS | `AuditLogPanel.test.tsx`, Phase 11 collapsed screenshot |
| AC-6 PII masked | PASS | API masked projection test, UI mask test, Phase 11 expanded masked screenshot |
| AC-7 pagination preserves filters | PASS | API cursor test, `buildAuditHref` test |
| AC-8 limit cap / invalid query | PASS | API test validates `limit=101` and invalid cursor as 400 |
| AC-9 empty / API error / broken JSON | PASS | API broken JSON test, UI empty/error test, Phase 11 empty screenshot |
| AC-10 read-only UI | PASS | DOM assertion has no edit/delete/rerun controls; no mutation API added |

No unverified AC remains.
