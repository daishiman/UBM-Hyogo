# Phase 7: AC マトリクス — 09b-B-cd-post-deploy-smoke-healthcheck

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09b-B-cd-post-deploy-smoke-healthcheck |
| phase | 7 / 13 |
| wave | 09b-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | NON_VISUAL |

## 目的

受入条件と evidence path を一対一に対応付ける。

## 実行タスク

1. 参照資料と親タスクの状態を確認する。完了条件: 未実装・未実測の境界が記録される。
2. 本タスク固有の scope / AC / evidence を確認する。完了条件: AC と evidence path が対応する。
3. user approval または上流 gate が必要な操作を分離する。完了条件: 自走禁止操作が明記される。

## 参照資料

- docs/30-workflows/unassigned-task/UT-29-cd-post-deploy-smoke-healthcheck.md
- .claude/skills/aiworkflow-requirements/references/deployment-details.md
- .claude/skills/aiworkflow-requirements/references/lessons-learned-ut-28-cloudflare-pages-projects-2026-04.md

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/09b-B-cd-post-deploy-smoke-healthcheck/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: 09a staging smoke execution, 09c production deploy execution runbook, Cloudflare Pages/Workers project settings, GitHub Actions secrets
- 下流: production release operational confidence, future deploy regression detection

## 多角的チェック観点

- #14 Cloudflare free-tier
- #16 secret values never documented
- #18 deployment drift detection
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

- deploy 後に web/api healthcheck が自動実行される
- Pages deployment source drift が検出される
- 失敗時に workflow が fail close する
- secret 実値なしの evidence が保存される
- 09a/09c の手動 smoke と責務重複しない

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 8 へ、AC、blocker、evidence path、approval gate を渡す。
