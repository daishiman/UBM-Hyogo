# Phase 13: PR作成 — admin-schema-diff-review-resolve-ux

`[実装区分: 実装仕様書]` / status: `pending_user_approval`

## 重要

**commit / push / PR はユーザーの明示承認後のみ実施する。** 本 wave で実行済み。

## 前提（local evidence wave 完了後に満たすべき条件）

1. Phase 5 の 5 ファイル実装が完了し、Phase 4 の 3 テストが GREEN。
2. `verify-design-tokens` HEX 0 / typecheck / lint clean / `git diff --quiet -- apps/api` exit 0。
3. Phase 11 screenshot 4 canonical 名を staging で取得（`schema-review-guide-default.png` / `schema-diff-card-collapsed.png` / `schema-diff-card-inline-form-expanded.png` / `schema-assign-help-visible.png`）。
4. `bash scripts/verify-pr-ready.sh` 3 点 PASS。

## PR 計画

| 項目 | 値 |
|------|-----|
| base | `dev`（CLAUDE.md PR フロー既定） |
| head | `feat/admin-schema-diff-review-resolve-ux` |
| title 案 | `feat(web): /admin/schema 差分レビューの割当フォームをカード直下インライン化し用語・目的説明を平易化` |
| 本文 | `implementation-guide.md` の Part 1/2/視覚証跡 + Phase 11 screenshot 参照（取得後） |

## 完了条件

- [ ] ユーザーが PR 作成を明示承認した（未承認のため pending）。
- [ ] 上記前提 1-4 を満たした。
