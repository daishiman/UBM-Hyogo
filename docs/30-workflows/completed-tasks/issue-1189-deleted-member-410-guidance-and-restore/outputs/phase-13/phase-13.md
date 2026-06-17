# Phase 13: PR 作成（user-gated）

## 境界

commit / push / PR 作成、および issue #1189 の状態変更はユーザー明示承認後のみ実施する。
本 wave では local implementation と focused evidence まで完了し、delivery は pending_user_approval。

## PR 方針（承認後）

| 項目 | 内容 |
|------|------|
| 推奨 branch | `feat/issue-1189-deleted-member-410-guidance-and-restore` |
| PR title | `fix: guide deleted member profile 410 and wire admin restore` |
| Issue 参照 | `Refs #1189`（状態変更は user-gated。自動 close keyword は使わない） |
| 含める変更 | C1 `/profile` 410 案内、C2 admin restore button、focused tests、workflow docs、aiworkflow sync |
| user-gated runtime | staging D1 mutation、authenticated screenshots、deploy smoke |

## 承認前チェック

- [x] `pnpm typecheck`
- [x] `pnpm lint`
- [x] `pnpm verify:tokens`
- [x] `pnpm verify:phase12-compliance`
- [ ] `git status --short` で意図した差分のみ
