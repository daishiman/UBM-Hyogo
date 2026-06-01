# 2026-05-30 issue-991-admin-fetch-error-typed-class

`issue-991-admin-fetch-error-typed-class` を `implemented_local_evidence_captured / implementation / NON_VISUAL` として同期。

- `apps/web/src/lib/admin/server-fetch.ts` に `AdminFetchError` / `isAdminFetchError` を追加し、admin API error path を typed throw へ置換。
- 既存 message format は非 PII body で後方互換維持。message suffix は 256 文字、`responseBodySnippet` は 500 文字。
- snippet 化前に email / phone 形状を redaction。
- `apps/web/src/lib/server-fetch/safe-fetch.ts` は admin import なしで structured `status` を優先し、既存 regex fallback を維持。
- focused Vitest 6 files / 31 tests PASS、web typecheck PASS、root lint PASS。
- Issue #991 は CLOSED 維持。staging runtime observation / commit / push / PR は user-gated。
