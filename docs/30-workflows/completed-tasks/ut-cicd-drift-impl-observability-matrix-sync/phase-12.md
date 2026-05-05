# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 前 Phase | 11 (手動テスト検証) |
| 次 Phase | 13 (PR 作成) |
| 状態 | spec_created |
| タスク種別 | docs-only / NON_VISUAL |

## 目的

`task-specification-creator` Phase 12 規約に従い、SSOT 同期改修の成果を 7 種類の必須ドキュメントに反映し、workflow-local artifacts parity、正本SSOT同期、skill LOGS / index sync を同一 wave で閉じる。completed ledger への移動は `spec_created` の時点では行わない。

## 必須タスク

### Task 12-1: 実装ガイド (Part 1 / Part 2)

成果物: `outputs/phase-12/implementation-guide.md`

| パート | 想定読者 | 必須内容 |
| --- | --- | --- |
| Part 1 | 中学生レベル | 「Observability Matrix とは何か」「なぜ対象 5 workflow と SSOT が一致しないと困るのか」「今回の修正で何が変わったか」を比喩で説明 |
| Part 2 | 技術者レベル | 対象 5 workflow の trigger / job / confirmed required context の対応表、Phase 5 patch の diff 要約、UT-GOV-001 との同期手順、再発防止のための運用フロー |

`## 視覚証跡` セクション必須記載:
> 本タスクは docs-only / NON_VISUAL のため、UI/UX 変更なし。Phase 11 のスクリーンショットは作成しない。代替証跡は `outputs/phase-11/manual-test-result.md` の bash コマンド実行ログ。

### Task 12-2: システム仕様更新

成果物: `outputs/phase-12/system-spec-update-summary.md`

| Step | 対象 | 内容 |
| --- | --- | --- |
| Step 1-A | workflow-local sync | (1) root / outputs `artifacts.json` parity, (2) Phase 1-12 outputs 実体作成, (3) 05a SSOT (`observability-matrix.md`) 同期, (4) skill LOGS / indexes sync |
| Step 1-B | 実装状況テーブル | 該当タスクの状態を `spec_created` として記載（コード実装なしのため `implemented` には遷移しない） |
| Step 1-C | 関連タスクテーブル | UT-GOV-001 / 05a-parallel-observability-and-cost-guardrails / UT-CICD-DRIFT-IMPL の 3 タスクを関連タスクとして列挙 |
| Step 2 | 新規インターフェース追加 | **N/A**: 本タスクは新規 API / 型 / IPC / event / route の追加なし |

### Task 12-3: documentation-changelog

成果物: `outputs/phase-12/documentation-changelog.md`

- 全 Step の結果を個別に記載（Step 1-A の 4 サブ更新 / Step 1-B / Step 1-C / Step 2 N/A）
- 同期種別: **workflow-local sync**（本タスクは workflow ドキュメント内の SSOT 同期に閉じ、apps 配下のソース変更を伴わない）
- AC-4 (documentation-changelog 同期記録) の達成証跡を本ファイルで担保する

### Task 12-4: 未タスク検出

成果物: `outputs/phase-12/unassigned-task-detection.md`

検出件数 0 件でも本ファイルは出力必須。本タスクで起票候補として記載すべき項目:

| 候補 | 概要 | 起票判定 |
| --- | --- | --- |
| Discord/Slack 通知導入 | 5 workflow の失敗通知を Discord webhook に集約する仕組みを新設 | 既存 `UT-07-notification-infrastructure` / `UT-08-IMPL-monitoring-alert-implementation` / `UT-29-cd-post-deploy-smoke-healthcheck` へ委譲 |
| SSOT 自動同期 CI workflow | `.github/workflows/` の構造変更時に observability-matrix.md drift を自動検知する gate を追加 | 既存 `UT-CICD-DRIFT-IMPL-WORKFLOW-LINT-GATE` / `task-ref-cicd-workflow-topology-drift-001` へ委譲 |
| スコープ外 workflow の SSOT 統合判断 | `e2e-tests.yml` / `pr-build-test.yml` / `pr-target-safety-gate.yml` を SSOT に含めるかの方針決定 | `e2e-tests.yml` は `task-08b-playwright-e2e-full-execution-001`、`pr-target-safety-gate.yml` は `UT-GOV-002-EVAL-oidc-and-workflow-run`、`pr-build-test.yml` は `task-ref-cicd-workflow-topology-drift-001` / `UT-CICD-DRIFT-IMPL-WORKFLOW-LINT-GATE` へ委譲 |

### Task 12-5: skill-feedback-report

成果物: `outputs/phase-12/skill-feedback-report.md`

- 改善点なしでも本ファイルは出力必須
- 使用 skill: `task-specification-creator` / `aiworkflow-requirements`
- 評価観点: Phase 1-13 構造の docs-only タスクへの適合性、NON_VISUAL 宣言フローの十分性

### Task 12-6: phase12-task-spec-compliance-check

成果物: `outputs/phase-12/phase12-task-spec-compliance-check.md`

- root evidence として、Task 12-1〜12-5 の 5 ファイルが揃っていることをチェックリスト化
- workflow-local sync 4 点（root artifacts / outputs artifacts / 05a SSOT / skill LOGS・indexes）が同一 wave で更新されたことを記録

## workflow-local sync チェック (Step 1-A 詳細)

| 同期点 | 対象ファイル | 確認方法 |
| --- | --- | --- |
| root artifacts | `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-observability-matrix-sync/artifacts.json` | `taskType=docs-only` / `visualEvidence=NON_VISUAL` |
| outputs artifacts | `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-observability-matrix-sync/outputs/artifacts.json` | root artifacts と 0 diff |
| 05a SSOT | `docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md` | 対象 5 workflow / confirmed context を含む分離表 / Discord current facts が揃う |
| skill sync | `.claude/skills/aiworkflow-requirements/*`, `.claude/skills/task-specification-creator/*` | LOGS / indexes の同期差分を確認 |

## artifacts.json parity

```bash
diff <(jq -S . docs/30-workflows/completed-tasks/ut-cicd-drift-impl-observability-matrix-sync/artifacts.json) \
     <(jq -S . docs/30-workflows/completed-tasks/ut-cicd-drift-impl-observability-matrix-sync/outputs/artifacts.json)
```

期待値: 0 diff（root と outputs/ の artifacts.json が完全一致）。

## generate-index.js 実行

```bash
node .claude/skills/aiworkflow-requirements/scripts/generate-index.js
node .claude/skills/task-specification-creator/scripts/generate-index.js
```

実行後 `pnpm indexes:rebuild` で skill indexes drift がないことを確認し、CI `verify-indexes-up-to-date` gate に備える。

## 成果物

Canonical 7 files は root summary の `main.md` と、Task 12-1〜12-6 の required outputs 6 files の合計を指す。`outputs/phase-12/` 配下の必須出力は次の 7 files。

- `main.md`
- `implementation-guide.md`
- `system-spec-update-summary.md`
- `documentation-changelog.md`
- `unassigned-task-detection.md`
- `skill-feedback-report.md`
- `phase12-task-spec-compliance-check.md`

## 完了条件

- 上記 7 canonical files（`main.md` + required outputs 6 files）が `outputs/phase-12/` に揃う
- workflow-local sync 3 点が同一 wave で更新済み
- artifacts.json parity が 0 diff
- skill indexes 再生成済み（CI gate 通過可能な状態）
- AC-4 (documentation-changelog 同期記録) が達成
