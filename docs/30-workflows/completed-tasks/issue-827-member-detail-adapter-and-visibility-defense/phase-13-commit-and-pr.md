# Phase 13: Commit & PR

## ブランチ命名

```
feat/issue-827-member-detail-adapter
```

## コミット粒度

| # | 内容 |
|---|------|
| 1 | `feat(issue-827): add MemberDetail pure adapter with visibility double-defense` (S1 + S2) |
| 2 | `refactor(issue-827): move field filter from MemberDetailSections to adapter` (S3 + S5) |
| 3 | `feat(issue-827): wire MemberDetail adapter from /(public)/members/[id] page` (S4) |

> 単一コミットでも可。ただし adapter 実装と component / page 変更は責務分離できるので、可能なら 3 分割を推奨。

## PR タイトル

```
feat(issue-827): MemberDetail pure adapter + visibility double-defense
```

## PR 本文テンプレート

```markdown
## Summary
- issue #827 (UT-DSF-05) の残ギャップ解消: pure function adapter `apps/web/src/lib/adapters/member-detail.ts` を新設し、`visibility === "public"` の二重防御 / unknown kind silent skip / activity 分離を adapter 責務に集約
- `MemberDetailSections` から filter ロジックを撤去し、page → adapter → presentational の単方向に整理
- 既存 visual snapshot は不変前提（render 結果は等価）

## Acceptance (issue #827)
- [x] adapter は pure function (unit test green)
- [x] visibility filter 二重防御動作確認
- [x] unknown field silent skip
- [x] notFound() / 6 セクション描画は既存実装 (task-12 + serial-05) で達成済、本 PR で挙動不変
- [x] typecheck / lint / build green
- [x] visual snapshot baseline 不変

## Test plan
- [ ] `mise exec -- pnpm typecheck`
- [ ] `mise exec -- pnpm lint`
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web test -- src/lib/adapters/__tests__/member-detail.spec.ts`
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web test -- src/components/public/__tests__/MemberDetailSections.component.spec.tsx`
- [ ] `bash scripts/verify-pr-ready.sh`
- [ ] visual snapshot diff なし（CI workflow_dispatch `visual-full` 任意確認）
```

## PR base

```
gh pr create --base dev --title "..." --body "..."
```

## issue 連携

issue #827 は既に **closed**。本 PR では reopen せず、PR 本文の Summary 冒頭で `issue #827 残ギャップ解消` と参照のみ記載する（自動 close キーワード `Closes #827` は使わない）。
