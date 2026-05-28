# Phase 11: Evidence inventory

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | members-not-displaying-form-sync-investigation |
| phase | 11 |
| state | implemented_local_runtime_pending |

## 目的

この Phase は Google Form response sync から public members 表示までの修復仕様とローカル実装エビデンスを検証可能な形へ固定する。

## 実行タスク

- 既存実装との差分を仕様に反映する。
- ローカル実装と Gate-B 検証結果を Phase 11 evidence に反映する。
- staging deploy / backfill apply / browser smoke は Gate-C user-gated として明示する。

## 参照資料

- 依存 Phase: phase-01 / Phase 1, phase-02 / Phase 2, phase-05 / Phase 5, phase-06 / Phase 6, phase-07 / Phase 7, phase-08 / Phase 8, phase-09 / Phase 9, phase-10 / Phase 10
- `artifacts.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-members-not-displaying-form-sync-investigation-artifact-inventory.md`

## 成果物

- 本 Phase ファイル

## 完了条件

- [x] 必須セクションが存在する。
- [x] Phase 固有本文が後続セクションに保持されている。


| Item | Path | Status | 取得手段 |
|------|------|--------|---------|
| local-verification.md | outputs/phase-11/local-verification.md | passed | local focused tests, D1 contract tests, typecheck, build, and script syntax |
| diagnose-pre.json | outputs/phase-11/diagnose-pre.json | pending Gate-C | `bash scripts/diagnose-members-pipeline.sh --env staging > outputs/phase-11/diagnose-pre.json` |
| backfill-dry-run.json | outputs/phase-11/backfill-dry-run.json | pending Gate-C | `bash scripts/backfill-publish-state.sh --env staging --dry-run > outputs/phase-11/backfill-dry-run.json` |
| backfill-apply.json | outputs/phase-11/backfill-apply.json | pending Gate-C | `bash scripts/backfill-publish-state.sh --env staging --apply > outputs/phase-11/backfill-apply.json` |
| diagnose-post.json | outputs/phase-11/diagnose-post.json | pending Gate-C | `bash scripts/diagnose-members-pipeline.sh --env staging > outputs/phase-11/diagnose-post.json` |
| members-page-before.png | outputs/phase-11/members-page-before.png | pending Gate-C | user-gated browser screenshot; no local UI code changed |
| members-page-after.png | outputs/phase-11/members-page-after.png | pending Gate-C | user-gated browser screenshot; no local UI code changed |
