# 2026-06-09 admin-schema-history-purpose-clarity-and-filter-fix

`docs/30-workflows/admin-schema-history-purpose-clarity-and-filter-fix/` を `implemented_local_evidence_captured / implementation / VISUAL` として同期。

## Summary

- `/admin/schema/history` の raw ZodError 表示の真因だった web adapter `AppliedFiltersZ` の `batchId` 欠落を修正。
- `formatSchemaHistoryError()` で raw JSON を human-readable な日本語 error へ変換。
- `SchemaHistoryPurposeExplainer` + glossary / steps を追加し、画面目的を明確化。
- 履歴一覧を table から `.schema-history-card` カード形式へ変更。
- `09g-screen-blueprints-admin.md` / aiworkflow ledgers / Phase 12 strict 7 を同一 wave で同期。

## Evidence

- focused Vitest 4 files / 60 tests PASS。
- local Playwright 2 tests PASS、Phase 11 screenshots 2 PNG present。
- `pnpm --filter @ubm-hyogo/web typecheck` PASS。
- `pnpm verify:tokens` PASS。
- `git diff origin/dev...HEAD -- apps/api apps/api/migrations` empty。

## User Gate

staging deploy、authenticated screenshot 2 点、commit、push、PR。
