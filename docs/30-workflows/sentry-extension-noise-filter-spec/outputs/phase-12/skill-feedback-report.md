# スキルフィードバックレポート

## テンプレ改善

| ID | 知見 | routing |
|----|------|---------|
| L-SENTRY-001 | observability filter仕様では「フィルタ可能なSDK到達event」と「拡張隔離コンテキスト等の到達不能console noise」をPhase 1から分離する必要がある | no-op: 既存 `task-specification-creator` は implementation target明確時の同一wave実装を既に要求しており、今回の具体例は本workflowとaiworkflow artifact inventoryへ記録 |
| L-SENTRY-002 | filter系タスクではfail-openを不変条件として、混在frame・判定不能・例外時にeventを残すことをAC化する | no-op: 汎用テンプレへ即時昇格するほど頻出していない。再発時に `patterns-testing-and-implementation.md` へ昇格 |

## ワークフロー改善

| ID | 知見 | routing |
|----|------|---------|
| L-SENTRY-003 | `spec_created` workflowに同一waveで実コード差分が入った場合、root artifacts / Phase 11 / Phase 12 / aiworkflow ledgerを `implemented_local_evidence_captured` へ再分類する | applied: 本workflowのartifacts、Phase 11/12、aiworkflow task ledgerへ反映 |
| L-SENTRY-004 | local util追加で公開契約変更N/Aでも、Step 1 task ledger / artifact inventory / discovery indexesはN/Aにしない | applied: `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` と artifact inventory / indexesへ反映 |

## ドキュメント改善

| ID | 知見 | routing |
|----|------|---------|
| L-SENTRY-005 | NON_VISUALのPhase 11はスクリーンショット不要だが、focused tests / typecheck / lintの実行結果を証跡として明記する | applied: `outputs/phase-11/manual-test-result.md` に記録 |
| L-SENTRY-006 | `skill-feedback-report.md` は「テンプレ改善 / ワークフロー改善 / ドキュメント改善」の3観点固定で、promotion/no-op理由を明記する | applied: 本ファイルを固定3観点へ再構成 |
