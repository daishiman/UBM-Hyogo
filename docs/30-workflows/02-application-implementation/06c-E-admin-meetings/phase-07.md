# Phase 7: AC マトリクス — 06c-E-admin-meetings

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-E-admin-meetings |
| phase | 7 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 1 の AC × Phase 4 の verify × Phase 5 の実装 placeholder を一対一で対応付ける。

## 実行タスク

1. AC を行、検証手段を列とする matrix を作る。完了条件: 各 AC に少なくとも 1 つの verify が紐づく。
2. 未紐付きの AC / 未使用の verify を 0 にする。完了条件: 孤立行・孤立列が無い。
3. Phase 6 の failure case を AC として吸収する。完了条件: 401/403/404/409/422 が matrix に載る。

## 参照資料

- outputs/phase-01/main.md
- outputs/phase-04/main.md
- outputs/phase-05/main.md
- outputs/phase-06/main.md

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
- AC が定量的（HTTP code / row 数 / column 順）に書かれているか。

## サブタスク管理

- [ ] AC × verify matrix を作る
- [ ] 孤立行 / 孤立列を 0 にする
- [ ] failure case を吸収する
- [ ] outputs/phase-07/main.md を作成する

## 成果物

- outputs/phase-07/main.md

## 完了条件

- AC matrix が完成し、全行・全列に対応がある
- failure case が AC として残らず吸収される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 8 へ、AC matrix を渡す。
