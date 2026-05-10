# Documentation Changelog — Issue #587

| path | change-summary | wave |
| --- | --- | --- |
| `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/index.md` | 新規（タスク仕様書本体） | same-wave |
| `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/phase-01.md` | 新規（要件定義 / Gate-R0〜R3） | same-wave |
| `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/phase-02.md` | 新規（既存実装調査 / 流用 vs 新規） | same-wave |
| `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/phase-03.md` | 新規（設計 / canary workflow / evidence schema） | same-wave |
| `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/phase-04.md` | 新規（環境準備 / 着手 Gate） | same-wave |
| `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/phase-05.md` | 新規（型定義 / op item） | same-wave |
| `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/phase-06.md` | 新規（関数シグネチャ / PR diff contract） | same-wave |
| `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/phase-07.md` | 新規（整合性検証） | same-wave |
| `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/phase-08.md` | 新規（エラーハンドリング / leakage 防止） | same-wave |
| `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/phase-09.md` | 新規（テスト計画 16 件） | same-wave |
| `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/phase-10.md` | 新規（runbook / canary 起動 / promotion / rollback） | same-wave |
| `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/phase-11.md` | 新規（NON_VISUAL evidence path 予約） | same-wave |
| `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/phase-12.md` | 新規（strict 7 file spec） | same-wave |
| `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/phase-13.md` | 新規（PR 作成 G1〜G4） | same-wave |
| `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/artifacts.json` | 新規（root workflow ledger） | same-wave |
| `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/outputs/artifacts.json` | 新規（outputs mirror。root と同値） | same-wave |
| `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/outputs/phase-11/.gitkeep` | 新規（実 evidence は実装サイクル） | same-wave |
| `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/outputs/phase-11/main.md` | 新規（spec evidence index / runtime evidence pending） | same-wave |
| `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/outputs/phase-11/manual-smoke-log.md` | 新規（NON_VISUAL 宣言） | same-wave |
| `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/outputs/phase-11/link-checklist.md` | 新規（link existence checklist） | same-wave |
| `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/outputs/phase-12/main.md` | 新規（Phase 12 index） | same-wave |
| `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/outputs/phase-12/implementation-guide.md` | 新規（Part 1 + Part 2） | same-wave |
| `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/outputs/phase-12/system-spec-update-summary.md` | 新規（SSOT 同期計画） | same-wave |
| `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/outputs/phase-12/documentation-changelog.md` | 新規（本ファイル） | same-wave |
| `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/outputs/phase-12/unassigned-task-detection.md` | 新規（未タスク 4 件） | same-wave |
| `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/outputs/phase-12/skill-feedback-report.md` | 新規（3 章 + routing） | same-wave |
| `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/outputs/phase-12/phase12-task-spec-compliance-check.md` | 新規（4 条件） | same-wave |
| `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/outputs/phase-13/.gitkeep` | 新規（PR 作成は別工程） | same-wave |
| `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/outputs/phase-13/main.md` | 新規（blocked_pending_user_approval gate） | same-wave |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | rotation telemetry 追記（実反映は same-wave commit） | same-wave |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | `..._CANDIDATE` / `..._PREVIOUS` field 追記 | same-wave |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | rotation セクション + 本体 runbook 相互リンク | same-wave |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | 1 行 entry | same-wave |
| `.claude/skills/task-specification-creator/LOGS/_legacy.md` | 1 行 entry | same-wave |
| `docs/30-workflows/runbooks/ml-model-artifact-rotation.md` | 新規（rotation runbook contract。実 runtime evidence は implementation cycle） | same-wave |
| `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-fu-02-a.md` | 新規（次世代 ML model 学習・選定） | same-wave |
| `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-fu-02-b.md` | 新規（自動 rotation scheduler） | same-wave |
| `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-fu-02-c.md` | 新規（rotation evidence long-term retention） | same-wave |
| `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-fu-02-d.md` | 新規（candidate path lifecycle automation） | same-wave |
| `scripts/cf-audit-log/rotation/types.ts` | 新規（same-wave implementation） | Wave N |
| `scripts/cf-audit-log/rotation/artifact-canary.ts` | 新規（same-wave implementation） | Wave N |
| `scripts/cf-audit-log/rotation/rotation-evidence-collector.ts` | 新規（same-wave implementation） | Wave N |
| `scripts/cf-audit-log/rotation/__tests__/*.test.ts` | 新規（same-wave implementation） | Wave N |
| `.github/workflows/cf-audit-log-artifact-canary.yml` | 新規（same-wave implementation） | Wave N |
