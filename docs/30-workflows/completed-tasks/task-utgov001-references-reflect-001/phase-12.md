# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-utgov001-references-reflect-001 |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-05-01 |
| 前 Phase | 11 |
| 次 Phase | 13 |
| 状態 | spec_created |

## 目的

実装ガイド、システム仕様更新サマリー、変更履歴、未タスク検出、skill feedback、compliance checkを作成し、aiworkflow-requirements反映タスクを閉じる。

## 実行タスク

1. `implementation-guide.md` を作成する。
2. `system-spec-update-summary.md` を作成する。
3. `documentation-changelog.md` を作成する。
4. `unassigned-task-detection.md` を作成する。
5. `skill-feedback-report.md` を作成する。
6. `phase12-task-spec-compliance-check.md` を作成する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 11 | phase-11.md | walkthrough |
| skill template | .claude/skills/task-specification-creator/references/phase-template-phase12.md | Phase 12必須成果物 |

## 実行手順

### ステップ 1: implementation guide

Part 1は中学生レベル、Part 2は技術者向けに、fresh GET evidenceからaiworkflow-requirementsへ反映する流れを書く。

### ステップ 2: system spec update summary

GitHub GET evidenceがある場合は実更新結果を記録する。fresh GETが無い場合は BLOCKED とし、推測反映しない。

### ステップ 3: 未タスク検出

`verify-indexes-up-to-date` が current contexts に無いケースでは、期待値との差分を未タスク化するか、現行 governance state として記録するかを判定する。0件でもレポートを作る。

## 統合テスト連携

Phase 13はPhase 12成果物とローカル確認をもとにPR準備へ進む。

## 多角的チェック観点

- Phase 12完了時に実行済み証跡と未実行ゲートの状態語が分離されているか。
- BLOCKEDをcompletedと誤記していないか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | implementation guide | pending |
| 2 | system spec update summary | pending |
| 3 | documentation changelog | pending |
| 4 | unassigned task detection | pending |
| 5 | skill feedback | pending |
| 6 | compliance check | pending |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/implementation-guide.md | 実装ガイド |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | 正本更新サマリー |
| ドキュメント | outputs/phase-12/documentation-changelog.md | 変更履歴 |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 未タスク検出 |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | skill feedback |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | 準拠確認 |

## 完了条件

- [ ] Phase 12必須7成果物が存在する
- [ ] system spec update summaryがGET evidence由来を明記している
- [ ] 未タスク0件でもレポートがある
- [ ] 本Phase内の全タスクを100%実行完了

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] `outputs/phase-12/*` を作成
- [ ] `artifacts.json` の Phase 12 状態を更新

## 次Phase

Phase 13: PR準備
