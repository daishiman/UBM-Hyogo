# Phase 13: PR

## ブランチ

`feat/admin-tag-queue-ui-and-404` → `dev`

## PR タイトル案

```
feat(admin-tags): align /admin/tags with prototype + 404 recovery hints
```

## PR 本文テンプレ

```
## Summary
- /admin/tags を claude-design-prototype の AdminTagsPage 設計言語に整合（page-head / grid-2 / sticky 右ペイン / Avatar / Chip / TAGGED 補足セクション）
- AdminSectionErrorClient のエラー表示を code 別の復旧ヒント分岐に拡張（401/403/404/5xx）
- dev/staging のみ 404 時に INTERNAL_API_BASE_URL host を console.warn（cookie/secret は出さない）

## Test plan
- [ ] pnpm typecheck / lint / web TagQueuePanel + AdminSectionErrorClient + server-fetch tests
- [ ] playwright staging-visual-authenticated admin-tags-authenticated.spec.ts pass
- [ ] outputs/phase-11/admin-tags-{empty,items}.png 添付
```

## ユーザー指示があるまで実行しないこと

- `git commit`
- `git push`
- `gh pr create`
- staging deploy
- baseline snapshot 更新（`--update-snapshots`）
