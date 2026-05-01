# Phase 9: 品質保証 — 08b-followup-001-parallel-playwright-e2e-full-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 08b-followup-001-parallel-playwright-e2e-full-execution |
| phase | 9 / 13 |
| wave | 8b-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL |

## 目的

free-tier、secret hygiene、a11y、運用リスクを確認する。

## 実行タスク

1. 参照資料と親タスクの状態を確認する。完了条件: 未実装・未実測の境界が記録される。
2. 本タスク固有の scope / AC / evidence を確認する。完了条件: AC と evidence path が対応する。
3. user approval または上流 gate が必要な操作を分離する。完了条件: 自走禁止操作が明記される。

## 参照資料

- docs/30-workflows/unassigned-task/task-08b-playwright-e2e-full-execution-001.md
- docs/30-workflows/08b-parallel-playwright-e2e-and-ui-acceptance-smoke/
- docs/00-getting-started-manual/specs/09-ui-ux.md
- .claude/skills/aiworkflow-requirements/references/testing-playwright-e2e.md

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/08b-followup-001-parallel-playwright-e2e-full-execution/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: 06a public pages, 06b member pages, 06c admin pages, 07a/07b/07c admin ops
- 下流: 09a staging deploy smoke

## 多角的チェック観点

- #5 public/member/admin boundary
- #8 localStorage/GAS prototype を正本にしない
- #9 /no-access 専用画面に依存しない
- 未実装/未実測を PASS と扱わない。
- placeholder と実測 evidence を分離する。

## サブタスク管理

- [ ] refs を確認する
- [ ] AC と evidence path を対応付ける
- [ ] blocker / approval gate を明記する
- [ ] outputs/phase-09/main.md を作成する

## 成果物

- outputs/phase-09/main.md

## 完了条件

- skipped spec が 0 件になる条件が定義される
- 実 Playwright report が保存される
- real axe report が保存される
- desktop/mobile screenshot が保存される
- CI gate 昇格前の secret hygiene が明記される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 10 へ、AC、blocker、evidence path、approval gate を渡す。
