# Phase 9 — QA

## 9.1 QA 観点

| カテゴリ | チェック項目 |
|----------|-------------|
| 機能 | admin 配下のどのページに遷移しても topbar 右側にログアウトボタンが見える |
| 機能 | ログアウト押下で `/login` にリダイレクトされ、再度 `/admin` にアクセスすると `/login?next=/admin` に戻される（既存挙動維持） |
| a11y | topbar 右側領域に focusable button が 1 つあり、accessible name「ログアウト」を持つ |
| a11y | `aria-hidden` 領域内に focusable 要素がない（注入時は `aria-hidden` 自体が DOM から消える） |
| design | ボタン色が `var(--ubm-color-*)` 経由で描画され、HEX 直書きの痕跡なし |
| 責務境界 | members / tags / meetings 等各ページで topbar に「新規追加」等ページ固有操作が混入していない |
| 責務境界 | 各 page の `AdminPageHeader` actions にログアウト導線が重複していない |

## 9.2 QA コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --dir apps/web exec vitest run
mise exec -- pnpm exec vitest run apps/web/src/features/admin/components/_layout/__tests__/AdminTopbarActions.spec.tsx
```

## 9.3 grep gate

```bash
# AdminTopbar / layout.tsx に "use client" が新規付与されていないこと
grep -n '"use client"' apps/web/src/components/layout/AdminTopbar.tsx || echo "OK: no use-client"
grep -n '"use client"' "apps/web/app/(admin)/layout.tsx" || echo "OK: no use-client"

# 新規 file に HEX / arbitrary color が含まれないこと
grep -nE 'bg-\[#|text-\[#|#[0-9a-fA-F]{3,8}' \
  apps/web/src/features/admin/components/_layout/AdminTopbarActions.tsx || echo "OK: tokens compliant"
```

## 9.4 DoD

- 9.2 / 9.3 全 pass
- axe critical 0 維持
