# Phase 12: ドキュメント更新（概要インデックス）

## 1. workflow_state

`implemented_local_evidence_captured / implementation / NON_VISUAL`。

本サイクルでは issue #871（CSP nonce 化）の仕様書作成だけで止めず、`apps/web` の local implementation、focused Vitest、grep gate、Phase 11 canonical evidence、aiworkflow-requirements 同期まで完了した。staging/production runtime verification、commit、push、PR は user-gated。

## 2. Phase 12 strict 7 outputs

| Output | 役割 |
|--------|------|
| [`main.md`](./main.md) | 本ファイル。Phase 12 概要インデックス |
| [`implementation-guide.md`](./implementation-guide.md) | 中学生レベル + 技術者レベルの実装ガイド |
| [`system-spec-update-summary.md`](./system-spec-update-summary.md) | system spec / aiworkflow 正本更新サマリ |
| [`documentation-changelog.md`](./documentation-changelog.md) | 本サイクルで追加・更新したファイルの changelog |
| [`unassigned-task-detection.md`](./unassigned-task-detection.md) | 派生未タスクの検出 |
| [`skill-feedback-report.md`](./skill-feedback-report.md) | skill feedback |
| [`phase12-task-spec-compliance-check.md`](./phase12-task-spec-compliance-check.md) | Phase 12 compliance check |

## 3. Phase 1-13 成果物一覧

| Phase | 成果物 |
|-------|--------|
| 1 | [`../phase-1/requirements.md`](../phase-1/requirements.md) |
| 2 | [`../phase-2/design.md`](../phase-2/design.md) |
| 3 | [`../phase-3/design-review.md`](../phase-3/design-review.md) |
| 4 | [`../phase-4/test-plan.md`](../phase-4/test-plan.md) |
| 5 | [`../phase-5/implementation-plan.md`](../phase-5/implementation-plan.md) |
| 6 | [`../phase-6/test-implementation-result.md`](../phase-6/test-implementation-result.md) |
| 7 | [`../phase-7/integration-result.md`](../phase-7/integration-result.md) |
| 8 | [`../phase-8/quality-gate.md`](../phase-8/quality-gate.md) |
| 9 | [`../phase-9/qa-result.md`](../phase-9/qa-result.md) |
| 10 | [`../phase-10/final-review.md`](../phase-10/final-review.md) |
| 11 | [`../phase-11/manual-test-result.md`](../phase-11/manual-test-result.md) + [`../phase-11/canonical-paths.json`](../phase-11/canonical-paths.json) |
| 12 | strict 7（§2） |
| 13 | [`../phase-13/pr-gate.md`](../phase-13/pr-gate.md) |

## 4. close-out 条件

Local close-out 条件は満たした:

1. CSP builder と middleware nonce propagation 実装済み。
2. focused Vitest 2 files / 17 tests PASS。
3. `rg "'unsafe-inline'" apps/web/src apps/web/middleware.ts apps/web/__tests__/middleware.spec.ts` 0 hit。
4. Phase 11 canonical evidence manifest 追加済み。
5. aiworkflow-requirements 正本・索引・artifact inventory 同期済み。

残る external close-out は Phase 13 user gate: staging/production response verification、route violation-zero smoke、commit、push、PR。
