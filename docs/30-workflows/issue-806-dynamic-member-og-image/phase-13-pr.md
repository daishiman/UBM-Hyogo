# Phase 13: PR 作成

## 1. ブランチ

`feat/issue-806-dynamic-member-og-image`（既に worktree で作成済み / 仕様書作成時点で `dev` から分岐）

## 2. base ブランチ

`dev`（CLAUDE.md ポリシー / memory `feedback_default_branch_dev`）

## 3. PR 前チェック

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
git status --porcelain   # 空であること
git diff dev...HEAD --name-only   # 変更ファイル一覧確認
```

## 4. PR title

```
feat(issue-806): dynamic member OG image generation
```

## 5. PR body テンプレート

```markdown
## Summary

- `/members/[id]/opengraph-image` route を新設し、member 固有の OG 画像 (1200×630 PNG) を返すようにする
- `/members/[id]` の `generateMetadata` で `og:image` / `twitter:image` を member-specific path に差し替え
- Playwright `public-metadata.spec.ts` に PNG response / 404 / meta path の 3 ケース追加

Refs #806（CLOSED のまま実装 — root OGP は #274 で完了済み。本変更は member 固有 OG を追加）

## 変更ファイル

- `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx`（新規）
- `apps/web/app/(public)/members/[id]/page.tsx`（修正）
- `apps/web/app/(public)/members/[id]/__tests__/opengraph-image.spec.tsx`（新規）
- `apps/web/src/lib/seo/site-metadata.ts`（doc コメント追加のみ）
- `apps/web/playwright/tests/public-metadata.spec.ts`（テストケース追加）

## Test plan

- [ ] `pnpm typecheck` PASS
- [ ] `pnpm lint` PASS
- [ ] `pnpm --filter @ubm-hyogo/web test` PASS（新規 spec を含む）
- [ ] `pnpm --filter @ubm-hyogo/web build` PASS（OpenNext Workers bundle）
- [ ] `curl -sI /members/<seed>/opengraph-image` → 200 image/png
- [ ] `curl /members/<seed>` の og:image が member-specific path
- [ ] `curl -sI /members/<bogus>/opengraph-image` → 404
- [ ] root `/opengraph-image` / `/`（top）/ `/members`（list）に regression なし

## Screenshots

`outputs/phase-11/screenshots/og-image-seeded.png` 参照
```

## 6. 作成コマンド

```bash
gh pr create --base dev --title "feat(issue-806): dynamic member OG image generation" --body "$(cat <<'EOF'
... (上記テンプレート)
EOF
)"
```

> CLAUDE.md「PR 作成の完全自律フロー」に従う。本プロンプトでは仕様書作成のみで PR 自体は作らない（コード実装が未完了のため）。

## 7. CLOSED issue へのリンク戦略

Issue #806 は既に CLOSED。PR description には:

- 冒頭に `Refs #806`（`Closes` ではなく `Refs`）
- 本文に「issue は CLOSED だが調査の結果実装が未完了であったため本 PR で根本対応する」旨を 1 行明記

PR merge 後、issue へのコメント追加（実装完了の追記）は別途手動で行う。

## 8. 関連ドキュメントの追従更新（PR 内で同時実施）

- `docs/30-workflows/unassigned-task/task-issue-274-followup-001-dynamic-member-og-image.md`
  → ステータス行を `未実施` → `spec_ready_implementation_in_progress`、参照リンクに `docs/30-workflows/issue-806-dynamic-member-og-image/` を追記
- PR merge 後（別 commit / 別 PR 可）に `docs/30-workflows/issue-806-dynamic-member-og-image/` を `docs/30-workflows/completed-tasks/` 配下へ移動
