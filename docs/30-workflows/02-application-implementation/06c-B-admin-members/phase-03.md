# Phase 3: 設計レビュー — 06c-B-admin-members

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-B-admin-members |
| phase | 3 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 2 の設計を 3 つ以上の代替案と比較し、不変条件と運用性で PASS / MINOR / MAJOR を判定する。

## 実行タスク

1. 代替案を 3 つ以上挙げる。完了条件: 各案の trade-off が記録される。
2. 採用案と却下案の理由を明文化する。完了条件: PASS-MINOR-MAJOR 判定が記録される。
3. blocker と未解決リスクを Phase 4 に渡す。完了条件: 引き渡し項目が決まる。

## 代替案比較

| 案 | 概要 | 採否 | 判定 |
| --- | --- | --- | --- |
| A: apps/web から D1 直参照 | SSR で D1 binding を直接呼ぶ | 却下 | MAJOR（不変条件 #5 違反） |
| B: apps/api 経由 + cookie forwarding | 06b-A session resolver を再利用 | 採用 | PASS |
| C: admin 専用 BFF を別 worker で建てる | 新 worker を追加 | 却下 | MAJOR（無料枠と運用負担） |
| D: 検索を client-side filter で擬似実装 | クエリを使わず全件取得 | 却下 | MAJOR（性能・無料枠・12-search-tags 不整合） |
| E: soft-delete を物理削除で代替 | DELETE で row を消す | 却下 | MAJOR（07-edit-delete 不整合・復元不可） |

## 参照資料

- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/07-edit-delete.md
- docs/00-getting-started-manual/specs/12-search-tags.md
- apps/api/src/middleware/require-admin.ts

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/06c-B-admin-members/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: Phase 2 設計
- 下流: Phase 4 テスト戦略

## 多角的チェック観点

- #4 / #5 / #11 / #13 の不変条件への適合
- 認可境界（admin / member / guest）の網羅
- 12-search-tags のクエリ仕様と整合
- 07-edit-delete の論理削除/復元ポリシーと整合

## サブタスク管理

- [ ] 代替案を 3 案以上記録する
- [ ] PASS-MINOR-MAJOR を判定する
- [ ] blocker を Phase 4 に渡す
- [ ] outputs/phase-03/main.md を作成する

## 成果物

- outputs/phase-03/main.md

## 完了条件

- 採用案が PASS、却下案の MAJOR 理由が不変条件で説明される
- 12-search-tags / 07-edit-delete に整合する案のみが採用されている

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 4 へ、採用案・blocker・テスト対象 endpoint を渡す。
