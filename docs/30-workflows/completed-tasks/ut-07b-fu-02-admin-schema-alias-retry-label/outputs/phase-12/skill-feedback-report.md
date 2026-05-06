# Skill Feedback Report - UT-07B-FU-02

## テンプレ改善

- 小規模 `implementation / VISUAL_ON_EXECUTION` では、実コード差分の有無を Phase 12 で再判定し、コード実装が入った場合は `spec_created` のまま維持しない。

## ワークフロー改善

- UI screenshot を後続取得する実装タスクでは、component evidence PASS と manual screenshot pending を Phase 11 `main.md` / `manual-evidence-deferred.md` に分離する。`outputs/phase-12` のみで Phase 11 boundary を PASS 扱いしない。

## ドキュメント改善

- Phase 12 strict outputs はファイル名を `main.md`, `implementation-guide.md`, `system-spec-update-summary.md`, `documentation-changelog.md`, `unassigned-task-detection.md`, `skill-feedback-report.md`, `phase12-task-spec-compliance-check.md` に固定する。短縮名 (`doc-changelog.md`, `skill-feedback.md`) は使わない。

## Routing

| Item | Routing | Evidence |
| --- | --- | --- |
| false green 防止語彙 | workflow-local no-op promotion | `phase-03.md`, `phase-10.md` を補正済み |
| VISUAL_ON_EXECUTION 境界 | workflow-local no-op promotion | `artifacts.json`, `phase-11.md` を補正済み |
| strict 7 file names | task-specification-creator 準拠反映 | `phase-12.md`, `outputs/phase-12/*` |
