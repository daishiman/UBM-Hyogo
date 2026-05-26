# Phase 13 — commit / PR

## 13.1 ブランチ戦略

- base: `dev`
- branch 名候補: `feat/issue-895-admin-topbar-actions-client-island`

## 13.2 commit メッセージ案

```
feat(admin): AdminTopbar actions slot に AdminTopbarActions client island を注入 (Refs #895)

- 新規 `apps/web/src/features/admin/components/_layout/AdminTopbarActions.tsx` (client island, SignOutButton 集約)
- `(admin)/layout.tsx` で `<AdminTopbar actions={<AdminTopbarActions />} />` に置換
- AdminTopbar / layout.tsx は Server Component のまま維持 (不変条件 #11 fail-closed)
- 責務境界明示: topbar actions = グローバル / AdminPageHeader actions = ページ固有
- 既存 spec 無修正 pass + 新規 AdminTopbarActions.spec.tsx 追加
```

## 13.3 PR テンプレ

```markdown
## Summary
- Issue #895 を解消。AdminTopbar の `actions` slot に admin グローバル操作 client island (`AdminTopbarActions`) を流し込み、MVP としてログアウト導線を topbar に集約。
- AdminTopbar / `(admin)/layout.tsx` は Server Component のまま維持し、client 操作は `AdminTopbarActions` のみに閉じ込め (不変条件 #11 fail-closed)。
- グローバル操作 (topbar actions) と ページ固有操作 (AdminPageHeader actions) の責務境界を component 冒頭 JSDoc + spec で明示。

## 変更ファイル
- 新規: `apps/web/src/features/admin/components/_layout/AdminTopbarActions.tsx`
- 新規: `apps/web/src/features/admin/components/_layout/__tests__/AdminTopbarActions.spec.tsx`
- 編集: `apps/web/app/(admin)/layout.tsx`

## Test plan
- [ ] `pnpm typecheck` 0 error
- [ ] `pnpm lint` 0 warn
- [ ] `vitest` 新規 spec + 既存 `(admin)/layout.spec.tsx` / `AdminTopbar.spec.tsx` 全 pass
- [ ] axe critical 0 (admin 配下 3 ページ)
- [ ] staging で admin ログイン → topbar ログアウト → `/login` redirect 確認
- [ ] staging tail で 5xx / unhandled error なし

Refs #895
```

## 13.4 commit / push / PR ゲート

- 本仕様書では commit / push / PR は **user-gated**（CLAUDE.md ポリシー準拠）
- ユーザー明示承認後に `gh pr create --base dev` を実行
- production への反映は dev → main の別 PR で行う

## 13.5 closeout チェック

- [ ] PR merge 後、本ディレクトリを `docs/30-workflows/completed-tasks/issue-895-admin-topbar-actions-client-island/` へ移動
- [x] `docs/30-workflows/completed-tasks/parallel-03-followup-004-admin-topbar-actions-buttons.md` へ source one-pager を吸収済み
- [ ] stale 参照 `rg "parallel-03-followup-004|issue-895-admin-topbar"` を全 docs/.claude 横断 grep し補修
- [ ] `mise exec -- pnpm indexes:rebuild`
- [ ] `gate-metadata:validate` / `verify:phase12-compliance` green
- [ ] Issue #895 close
