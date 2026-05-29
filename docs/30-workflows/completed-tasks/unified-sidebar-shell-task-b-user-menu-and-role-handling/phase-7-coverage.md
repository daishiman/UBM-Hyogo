# Phase 7: カバレッジ

## カバレッジ目標

| Layer | Target |
| --- | --- |
| `user-menu-config.ts` | branch 100%（`viewer` / `member` / `admin` 全分岐） |
| `SidebarUserAvatar.tsx` | admin badge 有/無、size sm/md の 4 分岐 |
| `SidebarUserMenu.tsx` | viewer/member/admin × collapsed true/false の 6 render、route close effect の 1 path、user=null branch |

## ローカル測定コマンド

```bash
mise exec -- pnpm --filter @ubm/web test --run --coverage src/components/shell
```

## 完了条件

focused component / config テストが branch coverage を満たし、未達がある場合は Phase 12 で未タスク化せず同一 execution wave で補完する（CONST_005）。
