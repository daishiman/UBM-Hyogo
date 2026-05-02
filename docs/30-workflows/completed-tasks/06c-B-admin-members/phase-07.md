# Phase 7: AC マトリクス — 06c-B-admin-members

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-B-admin-members |
| phase | 7 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 1 の AC × Phase 4 の検証 × Phase 5 の実装を 1 表に対応付け、抜け漏れを発見する。

## AC マトリクス

| AC | 検証層 (Phase 4) | 実装箇所 (Phase 5) | 失敗ケース (Phase 6) |
| --- | --- | --- | --- |
| 検索 q/zone/status/tag/sort が動作 | unit query builder + contract | apps/api list handler | sort 範囲外 422 |
| ページングが動作 | contract | apps/api list handler | page 過大 → 空配列 |
| 詳細が member + auditLogs を返す | contract | apps/api detail handler | 404 |
| delete | contract + authz | apps/api delete handler | 409 重複 / 404 |
| restore | contract + authz | apps/api restore handler | 409 / 404 |
| role mutation 不在 | contract + authz | apps/api routing | role mutation route 不在 |
| admin 以外で 403 | authz | require-admin middleware | guest 401 / member 403 |
| apps/web は cookie forwarding のみ | unit (web fetch util) | apps/web fetch helpers | D1 直参照を構造的に禁止 |
| audit_log 必須記録 | contract | audit writer | 書込み失敗時 5xx |

## 実行タスク

1. AC ごとの検証 / 実装 / 失敗対応を 1 表で確定する。完了条件: 全 AC に少なくとも 1 検証層が紐付く。
2. 抜け漏れを Phase 8 / 9 への申し送りに記録する。完了条件: gap が文書化される。

## 参照資料

- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/07-edit-delete.md
- docs/00-getting-started-manual/specs/12-search-tags.md

## 実行手順

- 対象 directory: docs/30-workflows/completed-tasks/06c-B-admin-members/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: Phase 1 AC, Phase 4 verify suite, Phase 5 runbook, Phase 6 failure cases
- 下流: Phase 8 DRY 化

## 多角的チェック観点

- #4 / #5 / #11 / #13 が AC に対応する検証層を持っている
- 検索仕様が 12-search-tags と一致する
- 論理削除/復元仕様が 07-edit-delete と一致する

## サブタスク管理

- [x] AC × 検証 × 実装 × 失敗の 4 軸表を完成させる
- [x] gap を記録する
- [x] outputs/phase-07/main.md を作成する

## 成果物

- outputs/phase-07/main.md

## 完了条件

- [x] 全 AC が検証層と実装に紐付く
- [x] 全 failure case が責任 layer を持つ

## タスク100%実行確認

- [x] この Phase の必須セクションがすべて埋まっている
- [x] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [x] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 8 へ、AC マトリクスと gap を渡す。
