# Phase 12: Task Spec Compliance Check

## Check

| 項目 | 判定 | Evidence |
| --- | --- | --- |
| implementation-guide.md | PASS | `outputs/phase-12/implementation-guide.md` が Part 1 / Part 2 / NON_VISUAL smoke を記録 |
| system-spec-update-summary.md | PASS | B-1 正本仕様、index、LOGS、no-op 理由、未タスク同期先を列挙 |
| documentation-changelog.md | PASS | 変更ファイル、validator、MINOR 解決、Phase 11 link を記録 |
| unassigned-task-detection.md | PASS | 3件を `docs/30-workflows/unassigned-task/` に full template 化 |
| skill-feedback-report.md | PASS | Phase 11 template 改善を `UT-B1-SKILL-FEEDBACK` に接続 |
| NON_VISUAL Phase 11 連携 | PASS | `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` が存在し、screenshot 不要理由を明記 |
| artifacts parity | PASS | `artifacts.json` と `outputs/artifacts.json` は同一内容で Phase 13 status を `blocked` に同期 |
| Phase 13 approval gate | PASS | `outputs/phase-13/main.md` と artifacts が user approval 未取得の `blocked` で一致 |
| validator実測 | PASS | `outputs/verification-report.md` は 0 error / 0 warning / PASS |

## Phase 11 Evidence State

| 項目 | 値 |
| --- | --- |
| visualEvidence | NON_VISUAL |
| screenshot | 不要 |
| evidenceState | placeholder |
| 実測ログ | 派生実装タスクで `outputs/phase-11/evidence/<run-id>/b1/` に保存 |
