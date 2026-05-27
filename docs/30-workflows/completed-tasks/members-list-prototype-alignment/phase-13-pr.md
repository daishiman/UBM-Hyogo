# Phase 13 — PR

## 1. User Gate

Commit、push、PR 作成はユーザー明示指示まで実行しない。

## 2. PR Summary Draft

`/members` list density を `MemberGrid` に統一し、`MemberCard` の zone/status chip、occupation/location icon meta、TagPicker heading、compact EmptyState を追加した。API / DB / auth contract は不変更。

## 3. Verification To Report

- `pnpm --filter @ubm-hyogo/web typecheck`
- `pnpm --filter @ubm-hyogo/web test -- MemberCard MemberGrid MemberFilters EmptyState`
- Phase 11 visual: pending_runtime, Playwright spec exists at `apps/web/playwright/tests/members-prototype-alignment.spec.ts`
