# Phase 4: テスト戦略 — 06c-B-admin-members

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-B-admin-members |
| phase | 4 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

unit / contract / E2E / authorization の 4 層で admin members のテスト責務を切り分ける。

## verify suite

| 層 | 対象 | 例 |
| --- | --- | --- |
| unit | query builder（q/zone/status/tag/sort）, audit logger | 検索パラメータが SQL 句に正しく変換される |
| contract | apps/api の 4 endpoint の I/O | `GET /api/admin/members?filter=published&q=foo&tag=a&tag=b&density=dense` の response shape |
| authorization | require-admin middleware | guest=401 / member=403 / admin=200 |
| E2E | apps/web 一覧→詳細→delete→restore | Playwright（08b で実行、seeded/sanitized fixture 前提） |

## 実行タスク

1. unit / contract / authorization の責務を割り当てる。完了条件: 各層が独立して落ちる前提条件が決まる。
2. E2E（08b）への引き渡し項目を決める。完了条件: smoke で必要な fixture が決まる。
3. 検索パラメータの組み合わせ table を作る。完了条件: 12-search-tags の網羅性が確認される。

## 参照資料

- docs/00-getting-started-manual/specs/12-search-tags.md
- docs/00-getting-started-manual/specs/07-edit-delete.md
- apps/api/src/routes/admin/members.ts
- apps/api/src/middleware/require-admin.ts

## 実行手順

- 対象 directory: docs/30-workflows/completed-tasks/06c-B-admin-members/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: Phase 3 採用案
- 下流: Phase 5 実装ランブック / 08b admin members E2E

## 多角的チェック観点

- #4 / #5 / #11 / #13 への適合をテストで担保する
- 401 / 403 / 404 / 422 の境界条件を網羅する
- audit_log に書かれることを contract test で検証する

## サブタスク管理

- [x] unit suite を定義する
- [x] contract suite を定義する
- [x] authorization suite を定義する
- [x] outputs/phase-04/main.md を作成する

## 成果物

- outputs/phase-04/main.md

## 完了条件

- [x] 4 層のテスト責務が分離されている
- [x] 検索パラメータ組み合わせが網羅されている
- [x] audit 書込みが検証対象に含まれている

## タスク100%実行確認

- [x] この Phase の必須セクションがすべて埋まっている
- [x] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [x] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 5 へ、テスト suite と 08b へ引き渡す fixture を渡す。
