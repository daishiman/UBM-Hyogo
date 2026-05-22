# ADR — packages/integrations test suffix

- Status: Accepted (2026-05-11)
- Context: モノレポ横断ルールに追随し、`.spec.ts` に統一する。
- Decision:
  - 横断ルール: `*.spec.ts` / `*.spec.tsx` を使用。`*.test.ts` 禁止。
  - integrations 固有: 既存の contract 慣例（`auth.contract.test.ts`）は `auth.contract.spec.ts` に rename して温存する。新規 prefix（`.unit` / `.mapper` 等）の導入は将来別タスク。
- Consequences:
  - `find packages/integrations -name '*.test.ts'` は常に 0 件
- Related: Issue #325, Issue #622, packages/shared/ADR-test-suffix.md
