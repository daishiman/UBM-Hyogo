# Phase 2: 設計 — 06c-E-admin-meetings

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-E-admin-meetings |
| phase | 2 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

`/admin/meetings` の module 構造、D1 schema、API contract、UI コンポーネント分割を最小責務で確定する。

## 実行タスク

1. D1 tables `meetings` / `meeting_attendances` の列・index・FK 制約を設計する。完了条件: schema が `08-free-database.md` の方針と整合する。
2. `apps/api` route handler の入出力 schema（zod）と `requireAdmin` mount 位置を設計する。完了条件: 5 endpoint が一覧化される。
3. `apps/web` `/admin/meetings` の Drawer / Form / Table 構成を設計する。完了条件: cookie forwarding のみで API を叩く。

## 参照資料

- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/05-pages.md
- docs/00-getting-started-manual/specs/09-ui-ux.md
- docs/00-getting-started-manual/specs/08-free-database.md
- docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx
- apps/api/src/middleware/require-admin.ts
- apps/web/middleware.ts

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/06c-E-admin-meetings/
- 本仕様書作成ではアプリケーションコード、D1 migration 適用、deploy、commit、push、PR 作成を行わない。
- Mermaid 構造図 / dependency matrix / module 設計を outputs/phase-02/main.md に記録する。

## 統合テスト連携

- 上流: 06c admin pages 本体, 06b-followup-002 session resolver, requireAdmin middleware
- 下流: 08b admin meetings E2E, 09a staging admin smoke

## 多角的チェック観点

- #4 admin-managed data 分離（Form schema に昇格しない）
- #5 apps/web D1 direct access forbidden
- #7 memberId/responseId separation
- #13 audit log
- #15 Auth session boundary
- 無料枠（D1 row 数 / Workers CPU 時間）を超過しない設計。

## サブタスク管理

- [ ] D1 schema を確定する
- [ ] API contract（zod）を確定する
- [ ] UI コンポーネント分割を確定する
- [ ] outputs/phase-02/main.md を作成する

## 成果物

- outputs/phase-02/main.md

## 完了条件

- `meetings` / `meeting_attendances` の DDL 案が固まる
- 5 endpoint の request/response schema が確定する
- apps/web の cookie forwarding 経路が確定する
- 全 mutation が audit log 出力点と紐づく

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 3 へ、設計案、依存矩陣、module 配置を渡す。
