# Gate Metadata Structured Ledger

## Status

| Item | Value |
| --- | --- |
| Workflow | `docs/30-workflows/completed-tasks/issue-589-gate-metadata-structured-ledger/` |
| State | `implemented_local_runtime_pending / implementation / NON_VISUAL` |
| Issues | `Refs #589`, `Refs #549` |
| Initial rollout | schema + validator + CI gate + Issue #549 artifacts backfill |

## Purpose

Gate metadata converts free-text workflow gates into a structured `metadata.gates[]` ledger inside `artifacts.json`. The goal is to let Phase 12 and CI verify gate state mechanically: each gate has an id, status, approver, timestamp boundary, and evidence path.

## Gate Entry Contract

```ts
type GateStatus = "pending" | "passed" | "failed" | "waived";

interface GateEntry {
  gate_id: string;
  status: GateStatus;
  passed_at: string | null;
  evidence_path: string;
  approver: string;
  notes?: string;
}
```

| Field | Rule |
| --- | --- |
| `gate_id` | `^Gate-[A-Z](-[A-Z0-9]+)*$` |
| `status` | `pending`, `passed`, `failed`, or `waived` |
| `passed_at` | ISO8601 string when `status` is `passed`; otherwise nullable |
| `evidence_path` | repo-root relative POSIX path for all statuses; existing file additionally required for `passed` gates |
| `approver` | GitHub username or `CODEOWNERS:<group>` |
| `notes` | optional free text |

## Validator Contract

| Case | Behavior |
| --- | --- |
| `metadata.gates` absent | WARN and skip for historical artifacts |
| changed `artifacts.json` passed through `--require-gates-for-changed` and `metadata.gates` absent | ERROR |
| `metadata.gates` is not an array | ERROR |
| schema parse failure | ERROR |
| `status === "passed"` and evidence path missing | ERROR |
| any status with absolute path or `..` traversal in `evidence_path` | ERROR |
| WARN only | exit 0 |
| any ERROR | exit 1 |

Canonical command:

```bash
pnpm gate-metadata:validate
pnpm gate-metadata:validate --require-gates-for-changed <changed-artifacts-json...>
```

## Operational Guidance (新規 artifacts.json 追加時)

新規 `docs/30-workflows/completed-tasks/<task-id>/artifacts.json`（および `outputs/artifacts.json`）を追加する PR では、`metadata.gates[]` を**必ず**含める。雛形・運用手順・再発防止チェックは [`lessons-learned-dev-merge-ci-gates-2026-05.md`](../lessons-learned/lessons-learned-dev-merge-ci-gates-2026-05.md) § 2 参照。canonical 雛形: `docs/30-workflows/completed-tasks/ut-17-followup-002-alert-relay-dedup-kv/outputs/artifacts.json`。

## Rollout Boundary

- Initial implementation owns `packages/shared/src/gate-metadata/**`, `scripts/gate-metadata/**`, root `package.json`, `.github/workflows/verify-gate-metadata.yml`, and Issue #549 artifacts backfill.
- Historical workflow artifacts without `metadata.gates[]` remain compatible through WARN/skip.
- PR CI must pass changed `artifacts.json` paths with `--require-gates-for-changed` so new or edited workflow artifacts cannot omit `metadata.gates[]`.
- Branch protection required-context mutation is user-gated and must not be executed without explicit approval.
- Closed Issues use `Refs #589` and `Refs #549`; do not use `Closes`, `Fixes`, or `Resolves`.
