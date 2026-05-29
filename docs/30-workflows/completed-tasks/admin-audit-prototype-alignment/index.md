---
workflow_id: admin-audit-prototype-alignment
workflow_state: implemented_local_runtime_pending
created_at: 2026-05-27
owner: daishiman
taskType: implementation
implementation_mode: existing-ui-alignment-plus-api-recovery
visualEvidence: VISUAL
prototype_source: docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx
prototype_coverage: AdminMembersPage / AdminTagsPage / SchemaDiffPage (admin page-head + Card + Filter grid + tbl の design language)
---

# 管理画面 監査ログ プロトタイプ整合 + API 404 修復

## 実装区分

`[実装区分: 実装仕様書]` — `apps/web/app/(admin)/admin/audit/`・`apps/web/src/components/admin/AuditLogPanel.tsx`・必要に応じて `apps/api/src/routes/admin/audit.ts` 周辺の経路設定・`apps/web` 側 env のコード変更を伴う。CONST_004 のデフォルト（実装仕様書）に従う。

## 真の論点（要件レビュー一次結論）

| 観点 | 結論 |
|------|----|
| 真の論点 | (a) `/admin/audit` が他の admin 画面と共通の design language（`AdminPageHeader` + Card surface + filter grid + tokenized table）を採用せず、bare `<header><h1>` + raw `<form>` + raw `<select>` / `<button>` で描画されている。(b) staging で `admin api /admin/audit?limit=50 failed: 404` が発生しデータが読めない。 |
| design language の正本 | プロトタイプには audit page は存在しないが、`AdminMembersPage` / `AdminTagsPage` / `SchemaDiffPage`（`pages-admin.jsx`）と同じ admin design language（`page-head` / `eyebrow` / `h-page` / `muted` / Card / Filter grid / `tbl`）を継承する。CLAUDE.md「プロトタイプ正本順位」不変条件3 に従い、新規 primitive は作らず既存 `apps/web/src/components/ui/` と `AdminPageHeader` を使う。 |
| API 404 の主仮説 | 順に切り分ける: H1) `INTERNAL_API_BASE_URL` の staging 設定欠落／誤値、H2) Hono sub-router の mount 順序 / path duplication で `notFoundHandler` が先に拾う、H3) staging deploy が古く `adminAuditRoute` が含まれていない、H4) `requireAdmin` middleware が `notFoundHandler` 相当の 404 を返している（コード上は 401/403 を返すので可能性低い）、H5) `INTERNAL_AUTH_SECRET` 不一致で gateway が 404 を返す構成。 |
| 依存・責務境界 | `apps/web` は `INTERNAL_API_BASE_URL` 経由のみで `apps/api` を呼ぶ（CLAUDE.md 不変条件 #5）。D1 直接アクセス禁止。Google Form schema 変更禁止。`/admin/audit` API の zod schema・response shape は変更しない。 |
| 価値とコスト | 価値: admin が監査ログをプロトタイプ品質の UI で 1 画面で把握でき、フィルタ操作が他 admin 画面と一貫する。404 解消により監査機能が staging で機能する。コスト最大部品: filter form の Card + grid 化、`tbl` styling、404 切り分け evidence 収集。新規 primitive 0。 |
| 改善優先順位 | (1) API 404 切り分け＋復旧（機能性回復）→ (2) `page.tsx` を `AdminPageHeader` 採用へ刷新 → (3) `AuditLogPanel` を Card + Filter grid + Button/Select primitives + tokenized `tbl` 化 → (4) `EmptyState` / `Pagination` の token 整合 → (5) Playwright admin-staging-visual 更新 |
| 4条件評価 | 価値性◯／ 実現性◯（既存 primitives + 既存 API で 1 サイクル完了）／ 整合性◯（不変条件と矛盾なし）／ 運用性◯（`verify-design-tokens` + Playwright admin-visual で回帰保護） |

## 目的

`apps/web/app/(admin)/admin/audit/`（管理者向け監査ログ画面）を、`pages-admin.jsx` の `AdminMembersPage` / `AdminTagsPage` 系と共通の admin design language に整える。同時に staging で発生している `/admin/audit?limit=50 → 404` を切り分けて復旧する。既存 API の response shape（`AdminAuditListResponseZ`）は一切変更しない。

## スコープ

| 含む | 含まない |
|------|---------|
| `page.tsx` を `AdminPageHeader` + section 構成へ刷新 | 新規 API endpoint 追加 |
| `AuditLogPanel.tsx` を Card / Filter grid / Button / Select / tokenized `tbl` 化 | `AdminAuditListResponseZ` の shape / zod schema 変更 |
| OKLch token への置換（HEX/raw class の除去） | D1 schema 変更 |
| `safeServerFetch` の 404 reason 切り分け evidence 取得 | Google Form schema 変更 |
| `apps/api/src/index.ts` の admin route mount 順序 inspect / 必要なら修正 | 新規 primitive（PageHeader 等）追加 |
| `INTERNAL_API_BASE_URL` / `INTERNAL_AUTH_SECRET` の staging 設定検証手順 | 監査ログ書込み（write）系の変更 |
| Playwright admin-staging-visual の audit spec 追加／更新 | E2E ログイン flow の変更 |

## タスク分割（CONST_007 — 1 サイクル完了原則）

| タスク | 主目的 | 関心ごと |
|--------|--------|---------|
| Task A | UI/UX prototype alignment | `apps/web` のみ（page.tsx + AuditLogPanel.tsx + 視覚整備 + visual spec） |
| Task B | API 404 切り分け + 修復 | `apps/api` 経路 / `apps/web` env / `safeServerFetch` 404 reason logging |

Task A と Task B は独立してレビュー・実装でき、UI 実装・error banner 確認・local unit test は並列実行可。正常系 staging visual baseline は `/admin/audit` API 404 復旧後に取得する。先送り（別 Issue / 別 PR）は行わない（CONST_007）。

## 実装・検証サマリ

Task A/B はローカル実装済み。`/admin/audit` は `AdminPageHeader` + Card/filter grid + Button/Select primitives + `tbl` に整合し、API 404 は root mount 回帰テスト（401/200）と safe-server-fetch 404 reason テストで再発検知する。Phase 11 には local authenticated fixture の default / filtered / empty screenshot を保存済み。staging deploy / secret mutation / authenticated staging visual baseline / commit / push / PR は user-gated。

## Phase 成果物リンク

- Phase 1（要件）: `outputs/phase-1/phase-1.md`
- Phase 2（設計）: `outputs/phase-2/phase-2.md`
- Phase 3（テスト設計）: `outputs/phase-3/phase-3.md`
- Phase 4〜13（実装・検証・同期・user gate 境界）: `outputs/phase-4/phase-4.md` 〜 `outputs/phase-13/phase-13.md`
- Phase 12 Task A 実装仕様: `tasks/task-A-ui-prototype-alignment.md`
- Phase 12 Task B 実装仕様: `tasks/task-B-api-404-recovery.md`
- 検証レポート: `outputs/verification-report.md`

## 関連 Issue / 参照

- staging URL: `https://ubm-hyogo-web-staging.daishimanju.workers.dev/admin/audit`
- 観測エラー: `監査ログを読み込めませんでした: admin api /admin/audit?limit=50 failed: 404`
- 関連完了 workflow: `docs/30-workflows/completed-tasks/admin-meetings-prototype-alignment/`（design language 採用先例）, `admin-tag-queue-ui-and-404-recovery/`（404 recovery hint パターン先例）
