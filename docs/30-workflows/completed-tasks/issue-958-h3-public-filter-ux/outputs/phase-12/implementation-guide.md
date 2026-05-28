# Implementation Guide

## Part 1: 中学生レベル

このタスクは、公開メンバー一覧が空に見える原因を利用者に分かるようにするための3つの道具を作る。

- 会員ページ: 自分が公開に同意しているかを確認し、必要なら Google Form を開けるカードを出す。
- 管理画面: 管理者が複数人を選んで公開状態に戻せる操作を用意する。
- 公開メンバー一覧: 公開できる人が0人でも、サイトが壊れていないことを説明する画面を出す。

## Part 2: 技術者レベル

Implementation targets:

- `apps/web/app/(member)/profile/_components/PublicConsentCallout.tsx`
- `apps/web/app/(member)/profile/page.tsx`
- `apps/web/src/components/admin/BulkRepublishDrawer.tsx`
- `apps/web/src/features/admin/hooks/useBulkRepublish.ts`
- `apps/web/src/features/admin/components/_members/MembersClientShell.tsx`
- `apps/web/src/components/public/AllHiddenFallback.tsx`
- `apps/web/app/(public)/members/page.tsx`

Constraints:

- No new API endpoint.
- No D1 schema change.
- No direct mutation of `publicConsent` from the web app.
- Admin publish changes must use existing `PATCH /admin/members/:memberId/status`.
- Colors must use existing OKLch token variables.

Current wave status: local implementation is present. Focused tests and local visual screenshots are validated in the review cycle; staging verification, commit, push, and PR remain user-gated.
