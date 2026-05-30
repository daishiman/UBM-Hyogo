# Phase 6: テスト追加

## 追加テスト

| File | Purpose |
| --- | --- |
| `apps/web/src/components/shell/__tests__/user-menu-config.spec.ts` | `buildUserMenuActions` の 3 ロール pure contract（順序込み deep-equal） |
| `apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx` | popover render / a11y / collapsed / route-close / role badge |

## 不変条件

- 新規追加 test は `*.spec.{ts,tsx}` のみ（`*.test.*` 禁止）。
- `it.todo` / `test.todo` を残さない（Phase 7 coverage gate）。
- `signOut` (`next-auth/react`) は `vi.mock` で no-op 化し、本物の navigation を起こさない。
- `usePathname` mock は per-test で値を切替可能な mutable ref 経由とする。

## 旧 component 参照 grep

```bash
git grep -n "PublicHeader\\|MemberHeader\\|AdminSidebar" -- apps/web/src/components/shell
```
本 task 単体では削除を行わないが、新規 shell 配下に旧名前の漏れが無いことを 0 件で確認する。

## 完了条件

新規テストが実装対象 3 ファイル（`user-menu-config.ts` / `SidebarUserAvatar.tsx` / `SidebarUserMenu.tsx`）と 1:1 対応し、focused vitest が green。
