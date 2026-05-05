# Phase 7: AC マトリクス — 09c-A-production-deploy-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09c-A-production-deploy-execution |
| phase | 7 / 13 |
| wave | 9c-fu |
| mode | serial |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL |

## 目的

AC と検証・evidence の対応表を作る。

## 実行タスク

1. 参照資料と親タスクの状態を確認する。完了条件: 未実装・未実測の境界が記録される。
2. 本タスク固有の scope / AC / evidence を確認する。完了条件: AC と evidence path が対応する。
3. user approval または上流 gate が必要な操作を分離する。完了条件: 自走禁止操作が明記される。

## 参照資料

- docs/30-workflows/unassigned-task/task-09c-production-deploy-execution-001.md
- docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/
- docs/00-getting-started-manual/specs/15-infrastructure-runbook.md
- .claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/09c-A-production-deploy-execution/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: 09a staging smoke green, 09b release/incident runbook, Phase 13 user approval
- 下流: post-release observation follow-ups

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
- [ ] outputs/phase-07/main.md を作成する

## 成果物

- outputs/phase-07/main.md

## 完了条件

- user approval evidence が保存される
- production D1 migration が Applied として確認される
- api/web production deploy が exit 0
- production public/member/admin smoke が green
- release tag と 24h verification summary が保存される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 8 へ、AC、blocker、evidence path、approval gate を渡す。
