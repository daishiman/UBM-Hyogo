# Phase 12 — ドキュメント更新

> **実装区分: 実装仕様書**。spec_created タスクの close-out（Step 1-A〜1-C / Step 2 / Phase 12 strict 7 成果物）。

## Task 12-1: 実装ガイド（Part 1/2）

[outputs/phase-12/implementation-guide.md](outputs/phase-12/implementation-guide.md) に Part 1（中学生レベル）/ Part 2（技術者）を作成。視覚証跡は VISUAL_ON_EXECUTION（実装後撮影・pending）。

## Task 12-2: システム仕様更新

- Step 1-A: 完了タスク記録（spec_created）。本タスクは aiworkflow-requirements の新規 interface 追加を**伴わない**（`photoThumbUrl` は MemberDetail viewmodel の optional 拡張だが、実装は user-gated で未実行のため spec 段階。Step 2 は実装時に判定）。ただし workflow 正本索引（quick-reference/resource-map/task-workflow-active/artifact inventory/changelog）は same-wave で同期する。
- Step 1-B: 実装状況テーブル = `spec_created`。
- Step 1-C: 関連タスクテーブル（#983 完了 / #1029 公開表示 / #1031 self upload / M-1 未タスク候補）更新。
- Step 2: **条件付き N/A**（spec 段階・コード未実行）。実装サイクルで `photoThumbUrl` を追加した際に aiworkflow-requirements の member detail contract を同 wave で更新する旨を [system-spec-update-summary.md](outputs/phase-12/system-spec-update-summary.md) に記録。

## Task 12-3: ドキュメント更新履歴

[outputs/phase-12/documentation-changelog.md](outputs/phase-12/documentation-changelog.md)。

## Task 12-4: 未タスク検出（0件でも必須）

[outputs/phase-12/unassigned-task-detection.md](outputs/phase-12/unassigned-task-detection.md)。M-1（content_hash R2 dedup）の未タスク化要否を判定。

## Task 12-5: スキルフィードバック

[outputs/phase-12/skill-feedback-report.md](outputs/phase-12/skill-feedback-report.md)。

## Task 12-6: 準拠チェック（root evidence）

[outputs/phase-12/phase12-task-spec-compliance-check.md](outputs/phase-12/phase12-task-spec-compliance-check.md)（canonical 9 見出し + Phase 11 evidence inventory）。

## 完了条件（Phase 12）

- [x] Phase 12 strict 7 成果物（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）を実体化
- [x] artifacts.json / outputs/artifacts.json parity
- [x] indexes:rebuild 冪等
