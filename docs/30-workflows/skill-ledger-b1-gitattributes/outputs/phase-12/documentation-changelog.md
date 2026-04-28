# Phase 12: Documentation Changelog

## 変更内容

| 対象 | 種別 | 内容 |
| --- | --- | --- |
| `docs/30-workflows/skill-ledger-b1-gitattributes/` | add | B-1 design workflow |
| `artifacts.json` | sync | Phase 11 / 12 outputs を実体と同期 |
| Phase 11 outputs | add | NON_VISUAL 証跡受け皿。`manual-smoke-log.md` に `evidenceState: placeholder` と `outputs/phase-11/evidence/<run-id>/b1/` を明記 |
| `system-spec-update-summary.md` | update | B-1 正本仕様、index、LOGS の同期根拠と task-specification-creator no-op 理由を記録 |
| `docs/30-workflows/unassigned-task/` | add | `UT-B1-IMPL` / `UT-B1-A2-REVIEW` / `UT-B1-SKILL-FEEDBACK` を full template 化 |

## Validator

`validate-phase-output.js` と `verify-all-specs.js --workflow` を実行対象とする。現行 `outputs/verification-report.md` は 0 error / 0 warning / PASS。

## Link / MINOR Resolution

| 項目 | 状態 | 根拠 |
| --- | --- | --- |
| TECH-M-01 A-2 完了レビュー | formalized | `task-skill-ledger-b1-a2-completion-review.md` |
| Phase 11 NON_VISUAL link | aligned | `manual-smoke-log.md` と `implementation-guide.md` が NON_VISUAL smoke を参照 |
| upstream runbook wording | aligned | B-1 は `skill-ledger-gitattributes-policy.md` と Phase 5 runbook の限定 glob 方針に一致 |
