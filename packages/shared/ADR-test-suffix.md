# ADR — packages/shared test suffix

- Status: Accepted (2026-05-11)
- Context: モノレポ横断ルール（`apps/api` Issue #325, `apps/web` Issue #621）に追随し、`.spec.ts` に統一する。
- Decision:
  - 横断ルール: すべての test ファイルは `*.spec.ts` / `*.spec.tsx` を使用する。`*.test.ts` は禁止。
  - shared 固有: 種別 prefix（`.unit` / `.zod` / `.db` 等）は本タスクでは導入しない。将来必要に応じて別タスクで段階導入する。
- Consequences:
  - `find packages/shared -name '*.test.ts'` は常に 0 件
  - ルート vitest.config の `include` glob `{test,spec}` 二段階は本 ADR の対象外（followup-003 で単一収斂）
- Related: Issue #325, Issue #622, packages/integrations/ADR-test-suffix.md
