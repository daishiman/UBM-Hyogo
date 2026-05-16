# Phase 1 成果物 — 要件定義

## 結論

phase-01.md に記載の AC-1〜AC-7 / inventory / 制約を全て確定。実装区分は「実装仕様書」。

## Inventory 実測 (実コードに対して再検証)

| Path | 状態 |
|------|------|
| `apps/web/app/layout.tsx` | 存在・modify 対象 (本実装で `ToastProvider` wrap 適用済) |
| `apps/web/src/components/ui/Toast.tsx` | 存在 (`ToastProvider` / `useToast()` named export) |
| `apps/web/middleware.ts` | 存在 (matcher `/admin/:path*` + `gate=admin_required`) |
| `apps/web/app/(admin)/admin/error.tsx` | 存在 (`role="alert"` + `reset()` 再試行ボタン) |
| `apps/web/src/features/admin/hooks/` | 本実装で新規作成 (`useAdminMutation.ts` / `index.ts` / `__tests__/useAdminMutation.spec.ts`) |

## Acceptance Criteria 確定

AC-1〜AC-7 を phase-01.md の通り凍結。実装後検証 (Phase 6/11) で全 AC PASS。

## DoD

- [x] AC-1〜AC-7 確定
- [x] inventory 実測値反映
- [x] 制約整合 (CLAUDE.md 不変条件)
- [x] ソース spec 誤記 `(admin)/error.tsx` → `(admin)/admin/error.tsx` 正規化
