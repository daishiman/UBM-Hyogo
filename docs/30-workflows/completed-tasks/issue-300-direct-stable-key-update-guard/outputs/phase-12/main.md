[実装区分: 実装仕様書]

# Phase 12 main — issue-300 direct stable_key update guard

## サマリー

- スコープ: direct `schema_questions.stable_key` UPDATE を CI / pre-commit / lint chain で恒久拒否する guard を追加
- 実装は spec 承認後の同サイクル内に反映（`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`）
- 7 ファイル必須セット（本ファイル / `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md`）

## Phase 11 → Phase 12 引継ぎ

- local PASS 5 点 evidence: `outputs/phase-11/evidence/{typecheck,lint,test,build,grep-gate}.log`
- 状態語彙: `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`（local 実装あり / CI runtime は Phase 13 PR で取得）

## 後続

- Phase 13 user approval gate（blocked）
