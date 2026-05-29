# Phase 13: PR作成

| 項目      | 値                          |
| --------- | --------------------------- |
| Phase     | 13 / 13                     |
| 名称      | PR作成                      |
| 状態      | pending_user_approval       |
| 作成日    | 2026-05-28                  |

## 1. 前提

- Phase 12 strict 7 が `present`
- `artifacts.json` parity が成立（root vs outputs）
- typecheck / lint / focused vitest / OpenNext build がすべて green
- `bash scripts/verify-pr-ready.sh` が green

## 2. PR base / branch

- base: `dev`（CLAUDE.md `PR作成の完全自律フロー` に従う）
- working branch: 親 workflow と統合する場合は `feat/public-header-logged-in-nav-cleanup`（Task A〜G を 1 PR に統合）。本 task 単独で出す場合は `feat/task-b-root-page-public-header-async`。

## 3. PR body 骨格

```
## Summary
- root page (/) で `await getAuthView()` し、Task A の async `PublicHeader` に props 配信
- guest / member の DOM `data-auth-state` 分岐を vitest で固定
- revalidate / connection / generateMetadata は不変

## Test plan
- [ ] `mise exec -- pnpm typecheck`
- [ ] `mise exec -- pnpm lint`
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run app/__tests__/page.spec.tsx`
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web build`
- [ ] staging `/` で session 別 DOM (`data-auth-state`) 観測（user-gated）

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 4. user-gated 操作

以下は user 明示承認後のみ実行:

- `git add` / `git commit`
- `git push`
- `gh pr create --base dev`
- Cloudflare staging deploy
- 認証済 `/` curl + wrangler tail

## 5. 完了条件

- PR URL を user に返却
- 採用ブランチ / 自動修復 / コンフリクト解消 / 残課題を 1 回だけ報告
