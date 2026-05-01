# Phase 8: DRY 化 — 06c-E-admin-meetings

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-E-admin-meetings |
| phase | 8 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

命名・型・path・endpoint の重複を排し、Before / After で記録する。

## 実行タスク

1. endpoint 命名（`/api/admin/meetings`）を他 admin endpoint と整合させる。完了条件: kebab-case / 単数複数の規約が他 admin route と一致する。
2. zod schema の `MeetingSchema` / `AttendanceSchema` を `packages/shared` に置くか api 内に置くかを判断する。完了条件: 重複が無い。
3. CSV serializer を共通 util にできるか検討する。完了条件: Before / After で diff が記述される。

## 参照資料

- docs/00-getting-started-manual/specs/11-admin-management.md
- packages/shared/src/
- apps/api/src/routes/admin/

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
- DRY と早すぎる抽象化のトレードオフ。

## サブタスク管理

- [ ] endpoint 命名を確認する
- [ ] zod schema 配置を確定する
- [ ] CSV serializer の共通化を検討する
- [ ] outputs/phase-08/main.md を作成する

## 成果物

- outputs/phase-08/main.md

## 完了条件

- 命名・型・path・endpoint の Before / After が記録される
- 早すぎる抽象化が回避される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 9 へ、Before / After 表を渡す。
