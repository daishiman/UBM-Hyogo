# Phase 6: 異常系検証 — 06c-B-admin-members

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-B-admin-members |
| phase | 6 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

401 / 403 / 404 / 409 / 422 / 5xx / sync 失敗 等の失敗ケースを網羅する。

## failure cases

| ケース | 期待 |
| --- | --- |
| 未ログイン | 401 / `/admin/members` は login へ redirect |
| member ロールで admin API 叩く | 403 |
| 存在しない id を soft-delete | 404 |
| 既に soft-delete 済の対象を再 soft-delete | 409 (conflict) |
| restore 対象が deletedAt=null | 409 |
| role body が不正 (`role: "owner"`) | 422 |
| audit_logs 書込み失敗 | 5xx + transaction rollback |
| 検索 sort key が許可リスト外 | 422 |
| ページ数が極端 (page=99999) | 200 + 空配列 |
| q が長大 (>256 文字) | 422 |

## 実行タスク

1. 上記 case ごとに contract / unit テストの担当を決める。完了条件: 各 case が責任 layer に紐付く。
2. audit_logs の rollback 動作を仕様化する。完了条件: 失敗時の整合性が決まる。
3. apps/web 側の error UI（toast / inline）を 09-ui-ux.md と整合させる。完了条件: error 表示が決まる。

## 参照資料

- docs/00-getting-started-manual/specs/09-ui-ux.md
- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/07-edit-delete.md

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/06c-B-admin-members/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: Phase 5 runbook
- 下流: Phase 7 AC マトリクス / 08b E2E

## 多角的チェック観点

- #11 admin も他人本文編集不可（更新系 422 で fail-fast）
- #13 audit 必須（失敗時も書込みが落ちないよう transaction）
- error UI が a11y / i18n に整合する

## サブタスク管理

- [ ] failure case を全件記述する
- [ ] rollback 動作を仕様化する
- [ ] outputs/phase-06/main.md を作成する

## 成果物

- outputs/phase-06/main.md

## 完了条件

- 401/403/404/409/422/5xx の境界が網羅される
- audit 書込み失敗時の整合性が定義される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 7 へ、failure case 一覧と AC を渡す。
