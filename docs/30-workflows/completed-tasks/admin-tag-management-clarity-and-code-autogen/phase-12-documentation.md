# Phase 12: ドキュメント同期

> SSOT: [`shared-context.md`](./shared-context.md)。本 Phase は Phase 12 の strict 7 成果物（`outputs/phase-12/`）への入口とサマリーを提供する。

## 目的

実装仕様書（implemented_local_evidence_captured）の close-out として、実装ガイド・システム仕様同期・変更履歴・未タスク検出・スキルフィードバック・compliance check を揃え、後続本サイクルが迷わず着手できる状態を担保する。

## 実行タスク

- Part 1/2 構成の実装ガイドを作成する（`outputs/phase-12/implementation-guide.md`）。
- システム仕様更新サマリー（Step 1-A〜1-C / Step 2 判定）を作成する（`outputs/phase-12/system-spec-update-summary.md`）。
- ドキュメント更新履歴（workflow-local / global skill sync を別ブロック）を作成する（`outputs/phase-12/documentation-changelog.md`）。
- 未タスク検出（current 0 / baseline OOS-1〜3）を作成する（`outputs/phase-12/unassigned-task-detection.md`）。
- スキルフィードバックレポートを作成する（`outputs/phase-12/skill-feedback-report.md`）。
- Phase 12 compliance check（canonical 9 見出し）を作成する（`outputs/phase-12/phase12-task-spec-compliance-check.md`）。

## 参照資料

- [`shared-context.md`](./shared-context.md) §5, §6, §8, §9, §12
- [`outputs/phase-12/main.md`](./outputs/phase-12/main.md)（Phase 12 総括）
- `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md`（canonical 9 見出し）

## 成果物（Phase 12 strict 7 + main）

| 成果物 | パス | 状態 |
|--------|------|------|
| 実装ガイド（Part 1/2） | [`outputs/phase-12/implementation-guide.md`](./outputs/phase-12/implementation-guide.md) | present |
| システム仕様更新サマリー | [`outputs/phase-12/system-spec-update-summary.md`](./outputs/phase-12/system-spec-update-summary.md) | present |
| ドキュメント更新履歴 | [`outputs/phase-12/documentation-changelog.md`](./outputs/phase-12/documentation-changelog.md) | present |
| 未タスク検出 | [`outputs/phase-12/unassigned-task-detection.md`](./outputs/phase-12/unassigned-task-detection.md) | present |
| スキルフィードバック | [`outputs/phase-12/skill-feedback-report.md`](./outputs/phase-12/skill-feedback-report.md) | present |
| compliance check | [`outputs/phase-12/phase12-task-spec-compliance-check.md`](./outputs/phase-12/phase12-task-spec-compliance-check.md) | present |
| 総括 | [`outputs/phase-12/main.md`](./outputs/phase-12/main.md) | present |

## 統合テスト連携

- compliance check の `Phase 11 evidence file inventory` は implemented_local_evidence_captured（local evidence 取得済み）のため local evidence を `present`、authenticated staging screenshot を `staging_visual_pending_user_gate` として分離記録する。

## 完了条件

- [x] strict 7（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check / main）が `outputs/phase-12/` に揃っている。
- [x] compliance check が canonical 9 見出しを逐語で満たす。
- [x] 未タスクは current 0 / baseline（OOS-1〜3）を分離記録。
- [x] `gate-metadata:validate`（Gate-A passed / ERROR 0）/ `verify:phase12-compliance`（ok:true）が緑。
