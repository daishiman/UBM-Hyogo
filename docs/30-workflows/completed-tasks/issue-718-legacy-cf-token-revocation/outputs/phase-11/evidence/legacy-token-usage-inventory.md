# Legacy Token Usage Inventory

## Status

`read_only_evidence_collected_pending_gate_c`

Generated on 2026-05-16 in worktree `task-20260516-201627-wt-4`. No mutation performed.

## Command Contract

```bash
rg -n "CLOUDFLARE_API_TOKEN|CLOUDFLARE_API_TOKEN_STAGING" .github apps packages scripts docs .claude
rg -n "secrets\.CLOUDFLARE_API_TOKEN(_STAGING|_ANALYTICS_READONLY)?\b" .github/workflows/
```

Exit code: 0 for both commands.

## Classification Rules

| Class | Meaning |
| --- | --- |
| current direct deploy token | Still required until runtime cutover evidence proves replacement |
| deprecated target | Historical or no-longer-used token name retained for traceability |
| audit-only token | Separate Cloudflare audit read token; not in revocation scope |
| generated / historical | Index, changelog, lesson, or consumed provenance |

## Live Workflow References (Gate C Scope)

Token name `CLOUDFLARE_API_TOKEN` (legacy long-lived deploy token) — **revocation target**:

| File | Line | Class |
| --- | --- | --- |
| `.github/workflows/backend-ci.yml` | 41 | current direct deploy token |
| `.github/workflows/backend-ci.yml` | 52 | current direct deploy token |
| `.github/workflows/backend-ci.yml` | 96 | current direct deploy token |
| `.github/workflows/backend-ci.yml` | 107 | current direct deploy token |
| `.github/workflows/web-cd.yml` | 44 | current direct deploy token |
| `.github/workflows/web-cd.yml` | 89 | current direct deploy token |

Token name `CLOUDFLARE_API_TOKEN_STAGING` (step-scoped staging token) — **out of revocation scope**:

| File | Line | Class |
| --- | --- | --- |
| `.github/workflows/d1-migration-verify.yml` | 40 | current direct deploy token (step-scoped) |
| `.github/workflows/d1-migration-verify.yml` | 59 | current direct deploy token (step-scoped) |

Token name `CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY` — **audit-only token, out of revocation scope**:

| File | Line | Class |
| --- | --- | --- |
| `.github/workflows/post-release-dashboard.yml` | 50 | audit-only token |
| `.github/workflows/post-release-dashboard.yml` | 76 | audit-only token |

Token name `CF_AUDIT_R2_TOKEN_PROD` / `CF_AUDIT_D1_TOKEN_PROD` (audit cold storage / monitor) — **audit-only token, out of revocation scope**:

| File | Line | Class |
| --- | --- | --- |
| `.github/workflows/cf-audit-log-cold-storage.yml` | 42 | audit-only token |
| `.github/workflows/cf-audit-log-cold-storage.yml` | 64 | audit-only token |
| `.github/workflows/cf-audit-log-monitor.yml` | 69 | audit-only token |
| `.github/workflows/cf-audit-log-monitor.yml` | 79 | audit-only token |

## Gate C Precondition

Live workflow references to `secrets.CLOUDFLARE_API_TOKEN` (the legacy token slated for revocation) remain present in `backend-ci.yml` (4 occurrences) and `web-cd.yml` (2 occurrences). Therefore Gate C revocation **must be preceded** by replacement of these references with the step-scoped equivalent under Issue #640 cutover. Revoking the secret while these references are live would break `backend-ci` and `web-cd`.

This is documentation-only; no workflow file is modified in this read-only phase.

## Non-workflow References (Generated / Historical)

All other matches (under `docs/30-workflows/completed-tasks/**`, `.claude/skills/aiworkflow-requirements/**`, `scripts/cf.sh`, `scripts/__tests__/workflow-env-scope.test.sh`) are classified `generated / historical` or `documentation / specification`. They are not Gate C revocation triggers — see file-count histogram per `rg -c` output.

## Redaction

Record file paths, line numbers, token names, command names, and exit codes only. No token values, suffixes, account IDs, or hashes are recorded above.

