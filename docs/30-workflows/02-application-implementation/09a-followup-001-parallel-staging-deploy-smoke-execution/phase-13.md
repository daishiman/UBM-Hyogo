# Phase 13: PR 作成 — 09a-followup-001-parallel-staging-deploy-smoke-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09a-followup-001-parallel-staging-deploy-smoke-execution |
| phase | 13 / 13 |
| wave | 9a-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

commit / PR / deploy / production mutation の user approval gate を固定する。

## 実行タスク

1. 参照資料と親タスクの状態を確認する。完了条件: 未実装・未実測の境界が記録される。
2. 本タスク固有の scope / AC / evidence を確認する。完了条件: AC と evidence path が対応する。
3. user approval または上流 gate が必要な操作を分離する。完了条件: 自走禁止操作が明記される。

## 参照資料

- docs/30-workflows/unassigned-task/task-09a-exec-staging-smoke-001.md
- docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/
- docs/00-getting-started-manual/specs/15-infrastructure-runbook.md

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/09a-followup-001-parallel-staging-deploy-smoke-execution/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: 08a coverage gate, 08b E2E evidence, Cloudflare staging secrets, staging Pages/Workers target
- 下流: 09c production deploy execution

## 多角的チェック観点

- #5 public/member/admin boundary
- #6 apps/web D1 direct access forbidden
- #14 Cloudflare free-tier
- 未実装/未実測を PASS と扱わない。
- placeholder と実測 evidence を分離する。

## サブタスク管理

- [ ] refs を確認する
- [ ] AC と evidence path を対応付ける
- [ ] blocker / approval gate を明記する
- [ ] outputs/phase-13/main.md を作成する

## 成果物

- outputs/phase-13/main.md

## 完了条件

- 09a Phase 11 の NOT_EXECUTED が実 evidence に置換される
- UI/authz/admin route smoke evidence が保存される
- Forms schema/responses sync evidence が保存される
- wrangler tail または取得不能理由が保存される
- 09c blocker が実測結果で更新される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 完了 へ、AC、blocker、evidence path、approval gate を渡す。
