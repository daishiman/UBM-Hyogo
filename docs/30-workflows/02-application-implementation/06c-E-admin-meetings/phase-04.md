# Phase 4: テスト戦略 — 06c-E-admin-meetings

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-E-admin-meetings |
| phase | 4 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

unit / contract / E2E / authorization の verify suite を実装前に固定する。

## 実行タスク

1. unit: meetings repository / attendances upsert / CSV serializer のテスト観点を列挙する。完了条件: 5 endpoint の正常系・境界系が網羅される。
2. contract: zod schema と API request/response の一致を契約テストで検証する。完了条件: `apps/api/test/admin/meetings.spec.ts` 想定の test ID が記録される。
3. E2E（Playwright）: admin login → 開催日作成 → 参加記録 → CSV 取得の流れを設計する。完了条件: 08b で実行可能なシナリオに落ちる。
4. authorization: 未ログイン / 非 admin / `x-ubm-dev-session` の挙動を仕様化する。完了条件: 401 / 403 境界が確定する。

## 参照資料

- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/13-mvp-auth.md
- apps/api/src/middleware/require-admin.ts
- apps/web/middleware.ts

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/06c-E-admin-meetings/
- 本仕様書作成ではアプリケーションコード、D1 migration 適用、deploy、commit、push、PR 作成を行わない。

## 統合テスト連携

- 上流: 06c admin pages 本体, 06b-followup-002 session resolver
- 下流: 08b admin meetings E2E, 09a staging admin smoke

## 多角的チェック観点

- #4 admin-managed data 分離
- #5 apps/web D1 direct access forbidden
- #13 audit log
- #15 Auth session boundary
- a11y（Drawer / Form のキーボード操作）。

## サブタスク管理

- [ ] unit 観点を列挙する
- [ ] contract 観点を列挙する
- [ ] E2E シナリオを書く
- [ ] authorization 境界を確定する
- [ ] outputs/phase-04/main.md を作成する

## 成果物

- outputs/phase-04/main.md

## 完了条件

- 5 endpoint と UI の verify suite が確定する
- 401 / 403 / 404 / 422 の境界が記録される
- E2E シナリオが 08b で実行可能な粒度になる

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 5 へ、verify suite と境界仕様を渡す。
