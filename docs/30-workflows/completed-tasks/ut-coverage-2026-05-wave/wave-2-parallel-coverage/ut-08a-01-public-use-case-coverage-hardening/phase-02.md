# Phase 2: 設計 — ut-08a-01-public-use-case-coverage-hardening

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-08a-01-public-use-case-coverage-hardening |
| phase | 2 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

## 目的

実行構造、evidence path、依存 matrix、rollback/skip 条件を設計する。

## 実行タスク

1. 参照資料と Issue #320 の状態を確認する。完了条件: 未実装・未実測の境界が記録される。
2. 本タスク固有の scope / AC / evidence を確認する。完了条件: AC と evidence path が対応する。
3. user approval または上流 gate が必要な操作を分離する。完了条件: 自走禁止操作が明記される。

## 参照資料

- GitHub Issue #320 (closed): UT-08A-01 public-use-case-coverage-hardening
- docs/30-workflows/unassigned-task/UT-08A-01-public-use-case-coverage-hardening.md
- docs/30-workflows/02-application-implementation/08a-A-public-use-case-coverage-hardening/（legacy mirror）
- docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/
- docs/00-getting-started-manual/specs/01-api-schema.md
- docs/00-getting-started-manual/specs/03-data-fetching.md

## 実行手順

- 対象 directory: docs/30-workflows/ut-coverage-2026-05-wave/wave-2-parallel-coverage/ut-08a-01-public-use-case-coverage-hardening/
- 対象スコープ: apps/api/src/use-cases/public/{form-preview,public-member-profile,public-stats,public-members}.ts と必要最小限の public route handler。
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: 08a partial close-out, 04a public API implementation
- 下流: 09a staging smoke, 09b release runbook, 09c production deploy gate

## 多角的チェック観点

- #1 responseEmail system field
- #2 responseId/memberId separation
- #5 public/member/admin boundary
- #6 apps/web D1 direct access forbidden
- 未実装/未実測を PASS と扱わない。
- placeholder と実測 evidence を分離する。

## サブタスク管理

- [ ] refs を確認する
- [ ] AC と evidence path を対応付ける
- [ ] blocker / approval gate を明記する
- [ ] outputs/phase-02/main.md を作成する

## 成果物

- outputs/phase-02/main.md

## 完了条件

- public use-case 4本（form-preview / public-member-profile / public-stats / public-members）に happy / null-or-empty / D1-fail の最低3ケースずつ追加される
- 既存 442 件以上のテスト regression なし
- coverage Statements >=85%, Branches >=80%, Functions >=85%, Lines >=85%
- 08a artifacts の partial 判定更新方針が明記される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく Issue #320 起点の follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 3 へ、AC、blocker、evidence path、approval gate を渡す。
