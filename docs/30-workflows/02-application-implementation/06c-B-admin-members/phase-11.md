# Phase 11: 手動 smoke / 実測 evidence — 06c-B-admin-members

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-B-admin-members |
| phase | 11 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

実装後の手動 smoke と evidence 取得手順を定義する（実測そのものは本仕様書作成では行わない）。

## manual evidence（取得対象 placeholder）

| 種別 | path（placeholder） |
| --- | --- |
| screenshot 一覧 | outputs/phase-11/screenshots/admin-members-list.png |
| screenshot 詳細 | outputs/phase-11/screenshots/admin-members-detail.png |
| screenshot soft-delete confirm | outputs/phase-11/screenshots/admin-members-soft-delete.png |
| curl GET list | outputs/phase-11/curl/admin-members-list.txt |
| curl GET detail | outputs/phase-11/curl/admin-members-detail.txt |
| curl POST soft-delete | outputs/phase-11/curl/admin-members-soft-delete.txt |
| curl POST restore | outputs/phase-11/curl/admin-members-restore.txt |
| curl POST role | outputs/phase-11/curl/admin-members-role.txt |
| wrangler tail（admin handler ログ） | outputs/phase-11/wrangler-tail.txt |
| audit_logs SELECT | outputs/phase-11/d1/audit-logs.txt |

## smoke 手順 placeholder

1. staging に admin role の test user で login し、`/admin/members` に到達する。
2. 検索 q/zone/status/tag を組合せて結果が変わることを確認、screenshot 取得。
3. 詳細画面を開き、audit log が表示されることを確認。
4. soft-delete 実行し、list で `status=deleted` filter 時のみ表示されることを確認。
5. restore 実行し、通常 list に戻ることを確認。
6. role 変更を実行し、audit_logs に記録されることを D1 SELECT で確認。
7. member ロールでアクセス → 403 を確認。
8. 未ログインアクセス → 401 / login redirect を確認。

> **注意**: 本仕様書作成タスクではこれらを実測しない。実測は実装担当者が Phase 5 完了後に行う。

## 参照資料

- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/07-edit-delete.md

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/06c-B-admin-members/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: Phase 10 GO 判定
- 下流: 09a admin staging smoke / Phase 12 ドキュメント更新

## 多角的チェック観点

- screenshot に PII（実会員 name / email）が映り込まない
- curl 出力に Authorization header の値を残さない
- evidence は staging 環境のものを使用し production を触らない

## サブタスク管理

- [ ] evidence path placeholder を確定する
- [ ] smoke 手順を確定する
- [ ] outputs/phase-11/main.md を作成する

## 成果物

- outputs/phase-11/main.md

## 完了条件

- evidence path placeholder が全件決まっている
- smoke 手順が再現可能

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 12 へ、evidence path と smoke 手順を渡す。
