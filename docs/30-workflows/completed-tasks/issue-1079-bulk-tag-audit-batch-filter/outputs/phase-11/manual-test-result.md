# Phase 11 手動テスト結果

## Local Evidence

| Classification | Evidence | Result |
| --- | --- | --- |
| API contract/repository | `pnpm exec vitest run --config vitest.d1.config.ts apps/api/src/routes/admin/audit.contract.spec.ts apps/api/src/repository/__tests__/auditLog.repository.spec.ts` | PASS: 2 files / 26 tests |
| Web component/page | `pnpm exec vitest run --config vitest.config.ts apps/web/src/components/admin/__tests__/BatchIdCopyButton.component.spec.tsx apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx apps/web/app/(admin)/admin/audit/page.page.spec.ts` | PASS: 3 files / 54 tests |
| API typecheck | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | PASS |
| Web typecheck | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | PASS |

## Review Fixes Captured

- `auditLog.listFiltered` now guards JSON path lookup with `json_valid(...)` before `json_extract(...)`, so existing malformed audit JSON rows do not make `?batchId=` return 500.
- `audit.contract.spec.ts` fixed a duplicate test audit id in the admin_member_note cursor regression.
- Broad API package wrapper (`mise exec -- pnpm --filter @ubm-hyogo/api test --run ...`) still expands to 79 files and failed on unrelated hook timeouts (`auditLog-export.spec.ts`, `import-attendance-bulk.spec.ts`); targeted D1 evidence above is the authoritative issue-1079 check.

## Runtime Visual Evidence

Authenticated `/admin/audit` runtime screenshots require an admin session and are user-gated.

| canonical 名 | 内容 | 状態 |
| --- | --- | --- |
| `audit-batchid-filter-empty.png` | batchId filter 入力欄（空） | pending_user_gate |
| `audit-batchid-filter-applied.png` | batchId で絞り込んだ結果一覧 | pending_user_gate |
| `audit-row-batchid-copy.png` | row detail の batchId 表示 + copy ボタン | pending_user_gate |

## Boundary

- Local code implementation and focused tests are complete.
- Staging deploy, authenticated screenshots, commit, push, PR, and Issue mutation remain user-gated.
