# Workflow Artifact Inventory — issue-230-lefthook-edit-guard

## Summary

| Item | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-230-lefthook-edit-guard/` |
| state | `implemented_local_runtime_pending / implementation / NON_VISUAL / implementation_complete_pending_pr` |
| issue | #230 OPEN; PR context uses `Refs #230` |
| parent | `docs/30-workflows/completed-tasks/skill-ledger-t6-hook-idempotency/` U-6 |
| scope | lefthook direct-edit ack gate, handwritten `.git/hooks/*` local detection, CI-observable hook integrity gate |

## Workflow Files

- `docs/30-workflows/completed-tasks/issue-230-lefthook-edit-guard/index.md`
- `docs/30-workflows/completed-tasks/issue-230-lefthook-edit-guard/phase-1.md` ... `phase-13.md`
- `docs/30-workflows/completed-tasks/issue-230-lefthook-edit-guard/artifacts.json`
- `docs/30-workflows/completed-tasks/issue-230-lefthook-edit-guard/outputs/artifacts.json`
- `docs/30-workflows/completed-tasks/issue-230-lefthook-edit-guard/outputs/phase-11/main.md`
- `docs/30-workflows/completed-tasks/issue-230-lefthook-edit-guard/outputs/phase-11/manual-test-result.md`
- `docs/30-workflows/completed-tasks/issue-230-lefthook-edit-guard/outputs/phase-11/visual-verification-skip.md`
- `docs/30-workflows/completed-tasks/issue-230-lefthook-edit-guard/outputs/phase-12/main.md`
- `docs/30-workflows/completed-tasks/issue-230-lefthook-edit-guard/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/completed-tasks/issue-230-lefthook-edit-guard/outputs/phase-12/system-spec-update-summary.md`
- `docs/30-workflows/completed-tasks/issue-230-lefthook-edit-guard/outputs/phase-12/documentation-changelog.md`
- `docs/30-workflows/completed-tasks/issue-230-lefthook-edit-guard/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/completed-tasks/issue-230-lefthook-edit-guard/outputs/phase-12/skill-feedback-report.md`
- `docs/30-workflows/completed-tasks/issue-230-lefthook-edit-guard/outputs/phase-12/phase12-task-spec-compliance-check.md`

## Implemented Files

- `scripts/hooks/lefthook-edit-guard.sh`
- `scripts/verify-hook-integrity.sh`
- `.github/workflows/verify-hook-integrity.yml`
- `lefthook.yml`
- `scripts/hooks/__tests__/lefthook-edit-guard.spec.ts`
- `scripts/__tests__/verify-hook-integrity.spec.ts`
- `CLAUDE.md`
- `docs/00-getting-started-manual/lefthook-operations.md`

## Evidence Boundary

This workflow is currently `implemented_local_runtime_pending`. Phase 12 strict 7 outputs are present. Local runtime evidence is captured in `outputs/phase-11/manual-test-result.md`:

- focused guard/integrity Vitest: 12 PASS
- AC-3 message assertion: `LEFTHOOK_EDIT_ACK`, `CLAUDE.md`, `lefthook-operations.md`
- typecheck/lint/shellcheck/YAML: PASS
- local guard and integrity exit-code evidence: exit 0

## Requirement Mapping

| Original AC | Observable enforcement |
| --- | --- |
| `.git/hooks/*` hand-written hook should fail CI | Local pre-commit guard observes `.git/hooks`; CI validates repository-observable `lefthook.yml` to `scripts/hooks/*.sh` integrity |
| `lefthook.yml` edit requires review or confirmation | `LEFTHOOK_EDIT_ACK=1` acknowledgement gate |
| rejection message links to policy | Guard message and `lefthook.yml` fail_text point to `CLAUDE.md` and `docs/00-getting-started-manual/lefthook-operations.md` |
| minimize false positives | dotted filename (`*.*`, e.g. `.sample`/`.old`/`.bak`) exclusion, lefthook signature exclusion, merge/rebase/cherry-pick/revert skip |

## Lessons

苦戦箇所の正本は `references/lessons-learned-issue-230-lefthook-edit-guard-2026-05.md`（L-I230-001..004）。

| ID | 要点 | 参照 |
| --- | --- | --- |
| L-I230-001 | AC-1「`.git/hooks/*` を CI で fail」は `.git` が CI checkout に現れず観測不能。目的を保ち local pre-commit guard + CI integrity gate へ 1:1 写像 | `scripts/hooks/lefthook-edit-guard.sh`, `scripts/verify-hook-integrity.sh` |
| L-I230-002 | real-repo の `.old`/`.bak` で false positive → 除外を `*.sample` 限定から `*.*`（ドット付き全般）へ一般化（git は dotted hook 名を実行しない） | `scripts/hooks/lefthook-edit-guard.sh:65-67`, test LG-h |
| L-I230-003 | worktree では marker=`--git-dir`（per-worktree）、hooks=`--git-common-dir`（共有）でディレクトリ解決を分ける | `scripts/hooks/lefthook-edit-guard.sh:45-46,59-60` |
| L-I230-004 | lefthook 注入 managed hook は `LEFTHOOK` 署名 allowlist で除外し正規運用を block しない | `scripts/hooks/lefthook-edit-guard.sh:68-69` |

## User-Gated Items

Commit, push, PR creation, GitHub Actions runtime observation, and Issue #230 mutation remain user-gated.
