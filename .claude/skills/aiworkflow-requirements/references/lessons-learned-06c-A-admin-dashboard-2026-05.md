# Lessons Learned — 06c-A admin dashboard follow-up

## L-06CA-001: spec_created / docs-only / remaining-only follow-up は contract diff として扱う

既実装の admin dashboard を「未実装」と誤認した。`docs/30-workflows/06c-A-admin-dashboard/` のように
spec_created / docs-only / remaining-only で立てる follow-up は「contract diff（既存実装と
正本仕様の差分）」として分類し、「missing implementation」と扱わないこと。Phase 12 では既存
コード `apps/api/src/routes/admin/dashboard.ts` 等を grep で実体確認し、workflow_state を
`spec_created` / `outputs_contract_only` のまま維持する。

## L-06CA-002: 単一 admin dashboard endpoint を維持し split しない

`/admin/dashboard/kpi` と `/admin/dashboard/recent-actions` への split を考えたが、テスト・
実装・admin gate コストが二重化するため単一 `GET /admin/dashboard` を維持する。同様の admin
follow-up でも、表示 1 画面を駆動する集約 endpoint は単一を既定とし、split は recent actions
が独立 paginate / cursor を要求する等の明確な driver が出るまで延期する。

## L-06CA-003: dashboard 表示由来の `dashboard.view` を recent actions / KPI から除外する

dashboard 閲覧で `dashboard.view` を audit_log に追記する場合、recent actions / KPI 算出側で
`dashboard.view` を含めると「ダッシュボード閲覧 → recent actions に dashboard.view 出現 → KPI
自己インフレ → 閲覧でさらに増える」という自己ループを起こす。recent actions と KPI 集計の
SQL / repository 層では `action != 'dashboard.view'` を必ず除外フィルタに含め、テストでも
`dashboard.view` row 投入時に表示・カウントから除外されることを assert する。
