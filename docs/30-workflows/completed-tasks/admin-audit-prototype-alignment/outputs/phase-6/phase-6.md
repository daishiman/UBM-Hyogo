# Phase 6: テスト追加

> workflow: admin-audit-prototype-alignment

## 追加テスト

| レイヤ | 追加内容 |
|--------|----------|
| web component | local `<h1>` 撤去、filter primitive、reset link button style、404 recovery hint |
| web safe fetch | 404 throw -> `ADMIN_FETCH_404` |
| web page | `AdminPageHeader` title / breadcrumb |
| api contract | `/admin/audit` mount で 404 ではなく auth layer に到達 |
| visual | admin-staging-visual audit spec（baseline capture は user-gated） |

