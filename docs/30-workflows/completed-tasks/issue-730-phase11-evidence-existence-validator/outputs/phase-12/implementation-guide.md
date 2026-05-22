# Implementation Guide

## Part 1: 中学生レベルの説明

学校で先生に「宿題を出しました」と言うだけでは、本当にノートが机の上にあるかは分かりません。
この変更は、Phase 12 の表で「あります」と書いた Phase 11 の証拠ファイルが、本当にその場所にあるかを機械的に見に行く仕組みです。
先に「なぜ必要か」を言うと、証拠がないのに合格したように見える事故を防ぐためです。

| 専門用語 | 日常語での言い換え |
| --- | --- |
| validator | 確認係 |
| evidence | 証拠メモ |
| workflow root | 作業フォルダ |
| fixture | 練習用の見本 |
| status | ある・まだ・対象外の印 |

## Part 2: Technical Summary

The validator reads `outputs/phase-12/phase12-task-spec-compliance-check.md`.
It locates the `Phase 11 evidence file inventory` table and checks only rows whose `Status` cell is exactly `present`.
Each `present` path must resolve inside the workflow root and exist as a tracked or local file.

## Part 3: Interfaces

```ts
type Phase11EvidenceClaim = {
  classification: string;
  evidencePath: string;
  status: "present" | "pending" | "n/a" | string;
};
```

`verifyComplianceFile()` now returns `reason: "missing-evidence"` when a present claim is missing or escapes the workflow root.
The parser accepts `Path` or `Evidence Path` columns and keeps status matching strict.
`pending` and `n/a` are not existence-checked; any other status is invalid and fails the compliance check.

## Part 4: Implementation Steps

1. Add `parse-phase11-evidence.ts` to parse the Phase 11 inventory table.
2. Add `verify-phase11-evidence-existence.ts` to resolve and check present evidence paths.
3. Wire the check after canonical heading validation in `verify-compliance-file.ts`.
4. Extend fixtures with pass and fail-missing-evidence cases.
5. Record the rule in the task-specification-creator reference.

## Part 5: Error Handling

Missing compliance files still return `missing-file`.
Missing canonical headings still return `missing-heading`.
A malformed or empty Phase 11 evidence table is treated as `missing-evidence` through the empty inventory marker.

## Part 6: Path Safety

Absolute paths are rejected by returning a missing-evidence result.
Relative paths are resolved against the workflow root and must remain inside that root.
`../outside.md` is therefore not accepted even if the target file exists elsewhere in the repository.

## Part 7: Status Rules

Only lowercase `present` is a present claim.
`pending` and `n/a` are accepted non-present states.
`Present`, `PRESENT`, and other variants are invalid and fail instead of being silently promoted to `present`.

## Part 8: Tests

The focused test file is `scripts/__tests__/verify-phase12-compliance.spec.ts`.
The added cases cover parser unit behavior, direct existence verification, missing evidence, empty present paths, directory paths, invalid status, numbered canonical heading parsing, and path escape.
Focused tests pass locally after refreshing dependencies with `pnpm install --frozen-lockfile`.

## Part 9: CI Integration

The existing `pnpm test:phase12-compliance` and `pnpm verify:phase12-compliance` scripts remain the entrypoints.
`.github/workflows/verify-phase12-compliance.yml` keeps the MVP-PAUSE pull_request boundary.
The workflow now uses an `origin/dev` fallback for manual `workflow_dispatch` runs so the verifier does not build an empty base ref while the PR trigger remains paused.

## Part 10: Known Limitations

This validator confirms physical existence only.
It does not inspect evidence content quality.
It does not generate missing Phase 11 files.

## Part 11: Verification Commands

```bash
pnpm test:phase12-compliance
pnpm verify:phase12-compliance
git status --short
git diff --stat
```

The first command initially hit an esbuild host/binary mismatch. `pnpm install --frozen-lockfile` refreshed node_modules, after which focused tests and the verifier passed locally.
Commit, push, and PR remain user-gated.
