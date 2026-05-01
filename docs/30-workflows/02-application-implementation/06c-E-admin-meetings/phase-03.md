# Phase 3: 設計レビュー — 06c-E-admin-meetings

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-E-admin-meetings |
| phase | 3 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 2 設計に対する simpler alternative を 3 案以上挙げ、PASS-MINOR-MAJOR を判定する。

## 実行タスク

1. alternative 案を 3 案以上書く（例: KV で代替 / meetings を Form schema に同居 / attendances を JSON 列に集約）。完了条件: 各案のトレードオフが明文化される。
2. 不変条件 #4/#5/#13/#15 違反の有無を確認する。完了条件: 違反案は MAJOR で却下される。
3. 採用案を確定する。完了条件: PASS-MINOR-MAJOR が記録される。

## 参照資料

- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/08-free-database.md
- docs/00-getting-started-manual/specs/13-mvp-auth.md
- outputs/phase-02/main.md

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
- alternative 案で無料枠 / 運用負荷が悪化していないか。

## サブタスク管理

- [ ] alternative 3 案を書く
- [ ] PASS-MINOR-MAJOR を判定する
- [ ] 採用案を確定する
- [ ] outputs/phase-03/main.md を作成する

## 成果物

- outputs/phase-03/main.md

## 完了条件

- 採用案が PASS で確定する
- 不採用案の MAJOR 理由が明記される
- 不変条件違反がないことが確認される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 4 へ、確定設計とレビュー結果を渡す。
