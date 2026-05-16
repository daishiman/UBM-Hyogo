# Phase 11 Runtime Evidence

## Summary

State: `partially_completed` — local + capture evidence は揃った。`playwright-visual-full` の PR-trigger 起動による 2-run stability は最終 PR 作成後に確認する。

## Evidence Inventory

| Evidence | Path | Status |
| --- | --- | --- |
| User approval marker | `outputs/phase-11/evidence/user-approval-marker.md` | completed |
| Baseline update workflow run | `outputs/phase-11/evidence/baseline-update-run.md` | completed (capture PASS, PR creation FAILED, recovered) |
| Baseline import log | `outputs/phase-11/evidence/baseline-import-log.md` | completed |
| Baseline filename + sha256 inventory | `outputs/phase-11/evidence/baseline-list.md` | completed (51 entries) |
| Visual-full 2-run stability summary | `outputs/phase-11/evidence/visual-full-stability.md` | pending (PR-trigger 経由で後段確認) |
| Matrix update evidence | `outputs/phase-7/coverage-report.md` | completed |
| QA command log | `outputs/phase-9/qa.md` | completed (typecheck / lint PASS) |

## Current Contract Checks

| Check | Result |
| --- | --- |
| `VISUAL_ROUTES` current count | 17 |
| visual-full project count | 3 |
| expected baseline count | 51 |
| local snapshot directory count | 51 (PASS) |
| PR trigger activation | activated (`pull_request.paths` 6 entries restored) |
| baseline capture | DONE (run 25960870639 + cherry-pick `b3fb7f4a`) |

## User-Gate Compliance

CONST_007 で禁止されていた以下のアクションは、本 session で AskUserQuestion による承認を得た後に実行した:

- `gh workflow run playwright-visual-baseline-update.yml` — approved
- `git cherry-pick b3fb7f4a` (baseline import) — approved
- `git commit` / `git push` — approved
- `gh pr create` — approved (Phase 13 で実施)

## Outstanding Item

`visual-full` の PR-trigger 経由 2-run stability 検証 (`outputs/phase-11/evidence/visual-full-stability.md`) は、Phase 13 で PR を作成した直後に CI 上で発火するため、その run 結果を追記する。
