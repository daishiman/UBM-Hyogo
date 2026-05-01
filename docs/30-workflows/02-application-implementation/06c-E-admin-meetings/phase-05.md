# Phase 5: 実装ランブック — 06c-E-admin-meetings

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-E-admin-meetings |
| phase | 5 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

実装手順を runbook + placeholder + 擬似コードで確定する。コードはこの仕様では書かない。

## 実行タスク

1. D1 migration `apps/api/migrations/00XX_meetings.sql` の追加手順を書く。完了条件: 列・index・FK が記載される。
2. `apps/api/src/routes/admin/meetings.ts` の擬似コード（route handler / requireAdmin mount / zod schema / audit log emit）を書く。完了条件: 5 endpoint が placeholder で揃う。
3. `apps/web/app/admin/meetings/page.tsx` の擬似コード（SSR fetch / Drawer / Form / Table / CSV download）を書く。完了条件: cookie forwarding のみが使われる。
4. sanity check（`pnpm typecheck` / `pnpm lint` / `pnpm test --filter @repo/api`）を列挙する。完了条件: コマンドが mise exec 経由で記録される。

## 参照資料

- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/05-pages.md
- docs/00-getting-started-manual/specs/08-free-database.md
- docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx
- apps/api/src/middleware/require-admin.ts

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/06c-E-admin-meetings/
- 本仕様書作成ではアプリケーションコード、D1 migration 適用、deploy、commit、push、PR 作成を行わない。
- 実装担当は本 phase の runbook を上から順に踏む。

## 統合テスト連携

- 上流: 06c admin pages 本体, 06b-followup-002 session resolver
- 下流: 08b admin meetings E2E, 09a staging admin smoke

## 多角的チェック観点

- #4 admin-managed data 分離
- #5 apps/web D1 direct access forbidden
- #7 memberId/responseId separation
- #13 audit log
- #15 Auth session boundary

## サブタスク管理

- [ ] D1 migration runbook を書く
- [ ] api route handler placeholder を書く
- [ ] web page placeholder を書く
- [ ] sanity check 一覧を書く
- [ ] outputs/phase-05/main.md を作成する

## 成果物

- outputs/phase-05/main.md

## 完了条件

- 実装担当が runbook を見て手戻りなく進められる粒度
- placeholder と擬似コードがコンパイル可能な構造で書かれる
- sanity check が `mise exec --` 経由で記載される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 6 へ、runbook と placeholder を渡す。
