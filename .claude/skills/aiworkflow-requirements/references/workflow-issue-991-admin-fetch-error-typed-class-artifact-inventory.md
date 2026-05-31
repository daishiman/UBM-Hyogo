# workflow-issue-991-admin-fetch-error-typed-class-artifact-inventory

## Summary

| Item | Value |
| --- | --- |
| workflow_id | `issue-991-admin-fetch-error-typed-class` |
| workflow root | `docs/30-workflows/completed-tasks/issue-991-admin-fetch-error-typed-class/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| parent | `docs/30-workflows/completed-tasks/admin-audit-prototype-alignment/` FU-AAUDIT-001 |
| issue | #991 CLOSED 維持。PR 文脈は `Refs #991` のみ |

## Product Files

| Path | Role |
| --- | --- |
| `apps/web/src/lib/admin/server-fetch.ts` | `AdminFetchError` / `isAdminFetchError` export、typed throw、body snippet redaction |
| `apps/web/src/lib/server-fetch/safe-fetch.ts` | structured `status` priority + regex fallback、admin import なし |

## Test Files

| Path | Role |
| --- | --- |
| `apps/web/src/lib/admin/__tests__/admin-fetch-error.spec.ts` | typed fields / message compatibility / 256 vs 500 / PII redaction / guard |
| `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts` | structured status priority / invalid status fallback |
| `apps/web/src/lib/admin/__tests__/server-fetch.binding.spec.ts` | service binding error message regression |
| `apps/web/src/lib/admin/__tests__/safe-server-fetch.spec.ts` | admin SafeResult code regression |
| `apps/web/src/lib/admin/__tests__/safe-server-fetch-404-vs-401.spec.ts` | 404/401 classification regression |
| `apps/web/src/lib/admin/__tests__/server-fetch.env.spec.ts` | env / logging regression |

## Evidence

| Command | Result |
| --- | --- |
| `mise exec -- pnpm exec vitest run apps/web/src/lib/admin/__tests__/admin-fetch-error.spec.ts apps/web/src/lib/admin/__tests__/server-fetch.binding.spec.ts apps/web/src/lib/admin/__tests__/safe-server-fetch.spec.ts apps/web/src/lib/admin/__tests__/safe-server-fetch-404-vs-401.spec.ts apps/web/src/lib/admin/__tests__/server-fetch.env.spec.ts apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts` | PASS: 6 files / 31 tests |
| `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| `mise exec -- pnpm lint` | PASS |

## User-Gated Items

- staging runtime observation / `wrangler tail`
- commit
- push
- PR creation

## Lessons Learned

詳細は `lessons-learned/lessons-learned-issue-991-admin-fetch-error-typed-class-2026-05.md`（L-I991-001..006 + anti-pattern 5）。

| ID | 要点 |
| --- | --- |
| L-I991-001 | `Error` → typed class 化でも `super()` message は byte-identical 維持（`admin api ${path} failed: ${status}` + 非空 body 時のみ ` body=${body.slice(0,256)}`）。構造化 field は message と分離 |
| L-I991-002 | 共通 `safe-fetch.ts` は admin を import せず `statusFromError` の duck typing（`status` property + `Number.isInteger`）で抽出、regex message parse を fallback に維持 |
| L-I991-003 | PII redaction（email/phone）は snippet 化の前段で適用し、message 256 / `responseBodySnippet` 500 を独立スライス。`""` は suffix 抑止だが snippet では null と区別保持 |
| L-I991-004 | `isAdminFetchError` は `instanceof` + `name === "AdminFetchError"` & `path/status` typeof の二段。Workers cross-module で prototype chain が切れても判定維持 |
| L-I991-005 | CLOSED follow-up Issue と現状コードの drift は index 冒頭の「Issue 記述 vs 現状コード」差分表で吸収し、現状コードを正本に AC 再定義。Issue は reopen せず `Refs #991` |
| L-I991-006 | byte-identical 維持 AC は「既存出力ケース（body あり/なし/256 超/空/読取失敗）× 新出力」突合マトリクスを Phase 2 で固定し Phase 6 test に対応付け |
