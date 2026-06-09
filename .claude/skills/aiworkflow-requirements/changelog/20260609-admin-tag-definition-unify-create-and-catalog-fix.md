# 2026-06-09 admin-tag-definition-unify-create-and-catalog-fix

`docs/30-workflows/completed-tasks/admin-tag-definition-unify-create-and-catalog-fix/` を `implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION` として同期。

## Summary

- `/admin/tags/catalog` の `initial.items` 欠落由来 `reduce` crash を `tagDefinitionView.normalizeTagDefinitionList()` で防御正規化。
- 既存 `POST /api/admin/tags` を消費する `createTag()` wrapper と `TagDefinitionCreateForm` を追加。
- `TagDefinitionPanel` に作成 / 編集 / 有効化 / 停止 / 完全削除を統合し、旧 `TagCatalogPanel` / `TagMasterPanel` を削除。
- shell nav を `タグ定義` / `タグキュー` の 2 本へ整理し、`/admin/tags/catalog` は `/admin/tag-master` redirect に縮約。

## Evidence

- Focused Vitest: 7 files / 33 tests PASS.
- `mise exec -- pnpm typecheck`: PASS.
- `mise exec -- pnpm lint`: PASS.
- `mise exec -- pnpm exec tsx scripts/verify-design-tokens.ts`: PASS.
- `git -C apps/api diff --stat`: empty.

## Boundary

`apps/api` / D1 / Google Form / `/admin/tags` TagQueuePanel are unchanged. Browser/staging visual screenshots, commit, push, and PR remain user-gated.
