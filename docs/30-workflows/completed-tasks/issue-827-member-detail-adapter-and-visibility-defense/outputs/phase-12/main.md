# Phase 12: Close-out Summary

## Result

Issue #827 の残ギャップは今回サイクル内で実装完了した。`MemberDetailSections` 内の表示判定を adapter に移し、`MemberLinks` / `MemberActivity` に渡す `allSections` も含めて UI 層で `visibility === "public"` を再確認する二重防御を追加した。

## Implementation

- Added `apps/web/src/lib/adapters/member-detail.ts`.
- Added adapter unit tests covering activity split, visibility filtering, URL filtering, non-display kind skip, empty-section removal, and immutability.
- Updated `MemberDetailSections` to render pre-filtered sections only.
- Updated `/members/[id]` page to call `buildMemberDetailViewModel`.

## Evidence

- `outputs/phase-11/focused-tests.log`: apps/web Vitest 888 passed, 1 skipped.
- `outputs/phase-11/typecheck.log`: `mise exec -- pnpm typecheck` passed.
- `outputs/phase-11/lint.log`: `mise exec -- pnpm lint` passed.
- `outputs/phase-11/build.log`: `ENVIRONMENT=local NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787 mise exec -- pnpm --filter @ubm-hyogo/web build` passed.
- `outputs/phase-11/verify-pr-ready.log`: `verify:phase12-compliance` and `gate-metadata:validate` passed; `indexes:rebuild drift` remains because this uncommitted branch intentionally includes regenerated aiworkflow index files and commit is user-gated.

## Boundary

Commit, push, PR creation, issue mutation, deployment/runtime verification, and clearing the PR pre-flight index-drift gate by committing regenerated index files remain user-gated.
