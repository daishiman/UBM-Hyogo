# Phase 12: ドキュメント整備

> **CONST_004 / CONST_005 準拠の実装仕様書**。task-specification-creator skill 規定の **6 必須タスク** を実施する仕様。実装本体ではなく、ドキュメント実書き込み手順とテンプレを確定する。

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-12/phase-12.md` |
| 状態 | implemented-local / production runtime smoke は Phase 11 で取得 |
| 親 Issue | #572（CLOSED） |
| taskType | implementation / visualEvidence: NON_VISUAL |

## 目的
attendanceProvider DI 完了化の production runtime smoke 完遂を Part 1（中学生レベル）/ Part 2（技術者レベル）両面で記録し、aiworkflow-requirements `references/` / `topic-map` / `keywords` への SSOT 反映、未タスク検出、skill feedback、compliance check を整備する。Phase 11 で取得した production smoke evidence と redact zero-hit ログを documentation に紐付ける。

## 実行タスク
詳細は `outputs/phase-12/phase-12.md` を正本とする。

## 参照資料
- `outputs/phase-12/phase-12.md`
- `outputs/phase-11/production-smoke-summary.md`
- `outputs/phase-11/redact-filter-zero-hit.log`
- 親 Issue #371（昇格対象） / #531 / #571 / #572（すべて CLOSED）

## 成果物
- `outputs/phase-12/phase-12.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 完了条件
- Phase 12 6 必須タスクのアウトプットファイルが実体配置済。
- workflow_state は `implemented-local`。production runtime smoke 取得済の場合は documentation 上で `PASS_RUNTIME_VERIFIED` を反映。
- 親 Issue #371 が `PASS_RUNTIME_VERIFIED` / `completed` 昇格済であることを `system-spec-update-summary.md` に明記。
- 関連 Issue #531 / #371 / #571 / #572 がすべて CLOSED であることを retrospective に記録（本仕様書のレトロスペクティブ機能）。
