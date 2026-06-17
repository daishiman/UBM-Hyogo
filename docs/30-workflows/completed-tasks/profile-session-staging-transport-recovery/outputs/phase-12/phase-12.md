# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `profile-session-staging-transport-recovery` |
| Phase | 12 / 13 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | `implemented_local_runtime_pending` |

## 目的

Phase 12 の strict 成果物（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）を生成し、本実行サイクル がそのまま実装に着手できる集約点を作る。本サイクルは `implemented_local_runtime_pending`（local 実装・focused 検証済み）であり、実装・テスト実行・deploy・commit・PR はすべて後続 / user-gated。

## 実行タスク

1. 実装ガイド（T01→{T02∥T03}∥T04 の実行順序・変更ファイル・検証コマンド・DoD 集約）を生成する。
2. システム仕様更新サマリ（`/me` 契約不変のため specs 変更なし）を生成する。
3. ドキュメント変更履歴を生成する。
4. 未タスク検出結果（current 1 件: S3 確定時の API worker 根治）を生成し、前身 Issue #1189-#1192 との対応関係を明記する。
5. skill feedback を生成する。
6. compliance check（canonical 9 見出し・§4 厳密トークン）を生成する。
7. `unassigned-task/task-api-worker-hard-error-root-fix.md` を formalize する。

## 完了条件

- [x] strict 7 outputs（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）が存在する
- [x] workflow_state=implemented_local_runtime_pending が全成果物で一貫している（実装済みと記載しない）
- [x] user-gated 境界（実装・deploy・commit・PR・staging 検証）が分離されている
- [x] unassigned-task 1 件が配置済み・前身 Issue との重複起票回避が明記されている

## 成果物

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `unassigned-task/task-api-worker-hard-error-root-fix.md`

## 参照資料

- `_shared-context.md`（SSOT・T01〜T04 / AC-1〜9 / S1〜S4 / F-A・F-B）
- `index.md`（SCOPE・正本順位）
- `outputs/phase-5/phase-5.md` + `task-01..04-*.md`（実装手順の正本）
- `outputs/phase-11/manual-test-result.md`（RT-A〜RT-D）

## 統合テスト連携

Phase 11 の RT-A〜RT-D で staging 復旧を確認した後、本 Phase の各成果物の完了状況を実装反映後の状態へ更新する。
