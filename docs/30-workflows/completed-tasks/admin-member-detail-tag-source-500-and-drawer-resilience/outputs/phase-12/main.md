# Phase 12: ドキュメント更新（index）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| taskType | implementation |
| visualEvidence | VISUAL |
| workflow_state | implemented_local_evidence_captured |

## 目的

Phase 12 の strict 7 成果物を index 化し、各成果物の完了状況を一覧する。本 wave は `implemented_local_evidence_captured` であり、local code implementation・focused Vitest・typecheck・verify:no-inline-style の結果を集約する。staging screenshot・commit・PR は user-gated。

## Phase 12 成果物一覧（strict 7）

| 成果物 | パス | 内容 | 完了状況 |
| --- | --- | --- | --- |
| main | `outputs/phase-12/main.md` | Phase 12 index（本ファイル） | implemented_local_evidence_captured（present） |
| implementation-guide | `outputs/phase-12/implementation-guide.md` | 中学生レベル概念説明（Part 1）+ 技術者向け実装ガイド（Part 2）+ 視覚証跡 | implemented_local_evidence_captured（present） |
| system-spec-update-summary | `outputs/phase-12/system-spec-update-summary.md` | Step 1-A/1-B/1-C/Step 2 のシステム仕様同期記録 | implemented_local_evidence_captured（present） |
| documentation-changelog | `outputs/phase-12/documentation-changelog.md` | Step 1-A/1-B/1-C/Step 2 のドキュメント差分記録 | implemented_local_evidence_captured（present） |
| unassigned-task-detection | `outputs/phase-12/unassigned-task-detection.md` | スコープ外・MINOR・TODO の未タスク検出（current 0 件・baseline 2 件） | implemented_local_evidence_captured（present） |
| skill-feedback-report | `outputs/phase-12/skill-feedback-report.md` | テンプレート/ワークフロー/ドキュメント観点の改善点 | implemented_local_evidence_captured（present） |
| compliance-check | `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical-9 見出しによる適合検証 | implemented_local_evidence_captured（present） |

## Phase 11 連携

| 成果物 | パス | 状況 |
| --- | --- | --- |
| manual-test-result | `outputs/phase-11/manual-test-result.md` | present（手動テスト計画 + 撮影計画 + 証跡主ソース定義） |
| screenshot plan | `outputs/phase-11/screenshots/screenshot-plan.json` | present（status=staging_visual_pending_user_gate） |
| capture metadata | `outputs/phase-11/screenshots/phase11-capture-metadata.json` | present（status=staging_visual_pending_user_gate・PNG 0 件） |
| screenshot coverage | `outputs/phase-11/screenshot-coverage.md` | present |
| staging runtime screenshot（SC-01/02/03） | `outputs/phase-11/screenshots/*.png` | pending（実装後・staging 認証必須・user-gated） |

## 完了条件

- [x] strict 7 成果物のリンクと完了状況を表化
- [x] Phase 11 evidence の状況（present / pending・PNG 0 件）を記録
- [x] workflow_state = implemented_local_evidence_captured を全成果物で整合

## 成果物

- `outputs/phase-12/main.md`（本ファイル）

## 参照資料

- `index.md`（SCOPE・タスク分解 Lane A / Lane B）
- `artifacts.json`（phase status / gates）
- `_shared-context.md` §8（Phase 11/12 の扱い）
- `outputs/phase-11/manual-test-result.md`

## 統合テスト連携

実装サイクルで Phase 11 の自動テストを実行し、本 index の完了状況を実装反映後の状態へ更新する。
