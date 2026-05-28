# Phase 8: リファクタ

## Breadcrumb 直貼り削除リスト (Task C で実施・本 task では確認のみ)

現在 `<Breadcrumb` を直貼りしている page (grep 結果):

1. `apps/web/app/(admin)/admin/requests/page.tsx`
2. `apps/web/app/(admin)/admin/tags/page.tsx`
3. `apps/web/app/(admin)/admin/schema/page.tsx`
4. `apps/web/app/(admin)/admin/audit/page.tsx`
5. `apps/web/app/(admin)/admin/identity-conflicts/page.tsx`
6. `apps/web/app/(admin)/admin/meetings/page.tsx`

> 上記 6 件 + 残りの page (members / dashboard/attendance / page.tsx root 等) も合わせて Task C で `AdminPageHeader` に統合する

## AdminPageHeader breadcrumbs 引数

- **維持する**。理由: Task C で各 page から breadcrumb を渡す経路として必要。slot 集約を廃止した分、page-head が単一窓口になる

## 本 task で行わないリファクタ

- 各 page の breadcrumb 撤去 (Task C スコープ)
- AdminPageHeader 内部実装の手直し (本 task は props 契約のみ確認)
- _shared/ 群の共通化 (別 followup)
