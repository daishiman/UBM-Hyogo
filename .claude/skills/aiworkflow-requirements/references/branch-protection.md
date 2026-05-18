# Branch Protection Governance

## Current contract

GitHub branch protection for `dev` and `main` is an external setting. Repository files record the intended contract and evidence paths, but fresh GitHub GET/PUT evidence is authoritative after user-approved operations.

## Required status checks

| Context | Scope | Status |
| --- | --- | --- |
| `audit-correlation-verify / verify` | `dev`, `main` | Issue #554 contract-ready; PUT blocked until user approval |
| `verify-design-tokens / verify-design-tokens` | `dev`, `main` | task-18 W7 contract-ready; PUT blocked until user approval（registered run 先行が必要） |
| `playwright-smoke / smoke (chromium)` | `dev`, `main` | task-18 W7 contract-ready; PUT blocked until user approval（registered run 先行が必要） |
| `playwright-smoke / visual (chromium, 4 screens)` | `dev`, `main` | task-18 W7 contract-ready; PUT blocked until user approval（registered run 先行が必要） |
| `visual-full (desktop)` | `dev`, `main` | task-761 applied under user approval at 2026-05-17T12:49:39Z |
| `visual-full (tablet)` | `dev`, `main` | task-761 applied under user approval at 2026-05-17T12:49:39Z |
| `visual-full (mobile)` | `dev`, `main` | task-761 applied under user approval at 2026-05-17T12:49:39Z |

## Invariants

These are intended governance invariants. Fresh GitHub GET evidence may reveal drift; Issue #554 Phase 13 must preserve current values by default and must not silently correct drift without explicit user approval.

| Field | Expected |
| --- | --- |
| `required_pull_request_reviews` | `null` |
| `lock_branch` | `false` |
| `enforce_admins` | `true` |
| `required_linear_history` | `true` |
| `required_conversation_resolution` | `true` |

## Issue #554 runbook

Workflow root: `docs/30-workflows/issue-554-audit-correlation-branch-protection-required-check/`

Before applying the required context:

1. Confirm `.github/workflows/audit-correlation-verify.yml` has at least one successful `main` run.
2. Capture `before-{dev,main}-protection.json`.
3. Build branch-specific normalized PUT payloads by merging `audit-correlation-verify / verify` into existing contexts while preserving current values for all other branch protection fields.
4. Apply `dev` first, verify invariants, then apply `main`.
5. Capture `after-{dev,main}-protection.json` and `diff-summary.md`.

Commit, push, PR creation, and GitHub branch protection mutation require explicit user approval.

If before snapshots show drift from the intended invariants, Phase 13 requires a user decision: contexts-only apply, same-operation drift correction, or separate task creation.

## Branch-specific drift rule（E2E Stage 3c / 2026-05-10）

`dev` と `main` は branch protection の pre 値が異なる場合がある。固定 payload による PUT は禁止。pre 値を保全したまま `required_status_checks.contexts` のみ append する。

| branch | 2026-05-10 pre evidence |
| --- | --- |
| `dev` | `required_pull_request_reviews=null`, `required_status_checks.strict=false` |
| `main` | `required_pull_request_reviews` object present, `required_status_checks.strict=true` |

PUT 手順:

1. branch ごとに `gh api repos/daishiman/UBM-Hyogo/branches/<branch>/protection` を read-only で取得し、`outputs/phase-11/branch-protection-{dev,main}-pre.json` に保存する。
2. pre payload をベースに `required_status_checks.contexts` だけ append し、他 field は pre 値を保全する。
3. `dev` を PUT して invariants verify、次に `main` を PUT する。
4. `outputs/phase-11/branch-protection-{dev,main}-post.json` を保存する。

CLAUDE.md の solo 運用ポリシー（`required_pull_request_reviews=null` 期待）と現実値の差は、3c では保全し、`task-e2e-stage3c-enforce-admins-claudemd-alignment-001` 等の policy alignment 別タスクで扱う。

## 3-state vocabulary（runtime mutation 系）

branch protection PUT を含むガバナンス mutation workflow では、Phase 12 を `PASS` 単独で閉じず、次の 3-state vocabulary を採用する。

| 状態 | 意味 |
| --- | --- |
| `spec_created` | Phase 1-12 完了、Phase 11 は read-only evidence のみ。`artifacts.json.actual_mutation_evidence_files` は空 |
| `external_mutation_completed` | PUT 待ち。approval marker `outputs/phase-13/user-approval-<task>-<timestamp>.md` 未配置 |
| `completed` | PUT 実行済み、post snapshot 保存済み、`artifacts.json.actual_mutation_evidence_files` fill 済み |

`artifacts.json` は read-only と mutation を別 ledger で持つ:

```
actual_read_only_evidence_files
actual_mutation_evidence_files
```

read-only GET evidence は spec wave で揃うが、PUT は user approval 後の runtime cycle まで実行できない。両者を 1 フィールドに混在させると、pre-only evidence で workflow を completed 誤判定するリスクが生じる。

## Stage 3c required contexts target（2026-05-10）

`required_status_checks.contexts` の target は `["ci", "Validate Build", "coverage-gate", "lighthouse-ci", "e2e-tests-coverage-gate"]`。

PUT 前 gate:

- 上記 context が `gh api repos/.../check-runs` で registered になっていること（`outputs/phase-11/check-runs.txt` 保存）
- `lighthouse-ci` / `e2e-tests-coverage-gate` は Stage 3a / 3b で **少なくとも 1 回成功 run** を産生していること

未登録 context を required に追加すると、PR が永遠に未充足で merge が完全にブロックされる。

## Task #761 visual-full required contexts target（2026-05-17）

Workflow root: `docs/30-workflows/task-761-visual-full-required-status-check/`.

The applied contexts are the measured check-run names:

- `visual-full (desktop)`
- `visual-full (tablet)`
- `visual-full (mobile)`

Application gates completed:

1. `.github/workflows/playwright-visual-full.yml` must not use `pull_request.paths`; otherwise docs-only or unrelated PRs can leave the required checks pending.
2. Capture dev/main before GET evidence.
3. Confirm at least one pull_request run emitted the three measured job names.
4. Record Phase 13 user approval with an ISO8601 timestamp.
5. Use the required status check contexts endpoint, not full branch protection PUT, unless rollback requires a separate explicit approval.

## References

- Workflow (Issue #554): `docs/30-workflows/issue-554-audit-correlation-branch-protection-required-check/`
- Workflow (E2E Stage 3c): `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts/`
- Artifact inventory: `references/workflow-issue-554-audit-correlation-branch-protection-required-check-artifact-inventory.md`
- Parent (Issue #516): `docs/30-workflows/completed-tasks/issue-516-github-audit-log-cross-source-correlation/`
- SSOT (related): `references/audit-correlation.md`
- Lessons learned: `lessons-learned/lessons-learned-issue-554-branch-protection-required-check-2026-05.md`, `lessons-learned/lessons-learned-e2e-stage3c-branch-protection-runtime-vocabulary-2026-05.md`
- Changelog: `changelog/20260508-issue554-audit-correlation-required-check.md`
- Workflow (Task #761): `docs/30-workflows/task-761-visual-full-required-status-check/`
