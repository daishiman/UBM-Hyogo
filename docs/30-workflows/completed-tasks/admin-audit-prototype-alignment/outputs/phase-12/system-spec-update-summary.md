# System Spec Update Summary

> workflow: admin-audit-prototype-alignment

## 不変条件（CLAUDE.md / system spec）への影響

| 項目 | 変更 | 評価 |
| --- | --- | --- |
| API surface (`AdminAuditListResponseZ`) | 変更なし | 不変条件維持 |
| D1 schema | 変更なし | 不変条件 #5（D1 直接アクセスは apps/api 限定）維持 |
| Google Form schema | 変更なし | 不変条件 #1/#2/#3/#4 維持 |
| OKLch tokens (`apps/web/src/styles/tokens.css`) | 参照のみ。HEX/raw class 撤去で正本準拠を強化 | 不変条件（design-tokens）強化 |
| admin design language (prototype primitives) | `/admin/audit` を `AdminPageHeader` + Card + Filter grid + `tbl` 化で他 admin 画面と統一 | プロトタイプ正本順位（不変条件3）強化 |
| `apps/web` → `apps/api` 経路 | `INTERNAL_API_BASE_URL` + admin gateway 経由を維持 | 不変条件 #5 維持 |
| 認可境界 | `requireAdmin` middleware 経由のまま | 不変条件維持 |

## 仕様書本体への追記/変更

| ドキュメント | 変更内容 |
| --- | --- |
| `docs/00-getting-started-manual/specs/` | 追記なし。`/admin/audit` の API contract は既存 `AdminAuditListResponseZ` のままで仕様正本に影響なし |
| `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` | 参照のみ。`AdminMembersPage` / `AdminTagsPage` / `SchemaDiffPage` の design language を `/admin/audit` に適用 |
| `apps/api/src/index.ts` の root mount | 既存の `app.route("/admin", adminAuditRoute)` を不変条件として固定し、`apps/api/src/index.spec.ts` で root mount 経由の 401（404 でない）回帰検知を追加 |
| `apps/web/src/lib/admin/safe-server-fetch.ts` | 既存 `ADMIN_FETCH_404` reason 展開を `/admin/audit?limit=50` に適用したことを spec 化（テスト追加） |

## 新規不変条件（local pattern として記録）

- `/admin/audit` page は `AdminPageHeader` を採用し、`page.tsx` 内で `<h1>` を直接描画しない（`AuditLogPanel` 内の page-local h1 撤去含む）。
- `/admin/audit` の filter form は `<form>` 直書きを避け、Card + grid + Button/Select primitives で構成する。
- root mount 回帰テスト（`apps/api/src/index.spec.ts`）は `/admin/audit?limit=1` で 401 を期待し、404 を回帰扱いとする。

## staging 環境への影響

- `INTERNAL_API_BASE_URL` / `INTERNAL_AUTH_SECRET` は既存値を継続。secret mutation は user-gated。
- staging deploy 後の認証付き `/admin/audit?limit=50` 200 確認は user-gated。
