# Issue #419 Pages Dormant Delete Runbook

state: SPEC_CREATED
runtime_execution: BLOCKED_UNTIL_DORMANT_PERIOD_AND_USER_APPROVAL
parent_issue: #355 CLOSED, use `Refs #355` only

## Purpose

This runbook fixes the destructive Cloudflare Pages deletion workflow as an execution contract. It does not authorize deletion. The runtime cycle must wait for Workers cutover evidence, a minimum two-week dormant observation period, and explicit user approval.

## Gate Summary

| Gate | Evidence | Required before next step |
| --- | --- | --- |
| AC-1 Workers cutover | `outputs/phase-11/preflight-ac1-ac2.md`, `outputs/phase-11/workers-pre-version-id.md` | Yes |
| AC-2 Pages dormant | `outputs/phase-11/preflight-ac1-ac2.md` | Yes |
| AC-3 >= 2 week observation | `outputs/phase-11/dormant-period-log.md` | Yes |
| AC-4 user approval | `outputs/phase-11/user-approval-record.md` | Yes |
| AC-5 redaction | `outputs/phase-11/redaction-check.md` | Yes |
| AC-6 spec cleanup | `outputs/phase-12/system-spec-update-summary.md` | After deletion |

## Step 1: Preflight

```bash
bash scripts/cf.sh whoami
bash scripts/cf.sh deployments list --config apps/web/wrangler.toml --env production
bash scripts/cf.sh pages project list
bash scripts/cf.sh api-get /client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects
```

Record redacted output in `outputs/phase-11/preflight-ac1-ac2.md`. Confirm Workers production is serving from the cutover path and the old Pages project has no active custom domain attachment.

## Step 2: Rollback Version Capture

```bash
bash scripts/cf.sh deployments list --config apps/web/wrangler.toml --env production
```

Record the current and previous Workers VERSION_ID values in `outputs/phase-11/workers-pre-version-id.md`. This preserves the first rollback path before deleting the second rollback path, the dormant Pages project.

## Step 3: Dormant Observation

Append observation samples to `outputs/phase-11/dormant-period-log.md`.

Required fields:

| Field | Requirement |
| --- | --- |
| `started_on` | YYYY-MM-DD |
| `ended_on` | YYYY-MM-DD, at least 14 days after `started_on` |
| `workers_4xx_5xx_summary` | Stable or explained |
| `pages_traffic` | 0 or explained |
| `rollback_triggered` | Must be `no` before deletion |

## Step 4: User Approval

Before any delete command, capture explicit approval in `outputs/phase-11/user-approval-record.md`.

Accepted approval examples:

- `Pages プロジェクト削除を承認します`
- `approve Pages project deletion`

Gate 1 approval for a spec PR does not count as Gate 2 approval for deletion.

## Step 5: Delete

Deletion is blocked until Steps 1-4 pass.

```bash
bash scripts/cf.sh pages project delete <PROJECT_NAME> --yes
```

Before running, confirm the exact wrangler syntax with:

```bash
bash scripts/cf.sh pages project delete --help
```

Record exit code and redacted output in `outputs/phase-11/deletion-evidence.md`.

## Step 6: Post-Deletion Smoke

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://<production-host>/
curl -sS -o /dev/null -w '%{http_code}\n' https://<staging-host>/
```

Record results in `outputs/phase-11/post-deletion-smoke.md` within one hour of deletion.

## Step 7: Redaction Gate

```bash
rg -i '(CLOUDFLARE_API_TOKEN|bearer|token=|sink|secret|account_id)' \
  docs/30-workflows/issue-419-pages-project-dormant-delete-after-355/outputs/
```

Record the command, timestamp, and zero-match result in `outputs/phase-11/redaction-check.md`. If any match appears, redact the evidence before committing.

## Step 8: aiworkflow-requirements Cleanup

After deletion succeeds, update the Pages references listed in `outputs/phase-12/system-spec-update-summary.md` to `削除済み（YYYY-MM-DD）`, then rebuild indexes if the generator is available.

```bash
mise exec -- pnpm indexes:rebuild
```

## Prohibitions

- Do not run `wrangler` directly; use `bash scripts/cf.sh`.
- Do not run deletion before AC-1 through AC-4 pass.
- Do not write `Closes #355`.
- Do not commit, push, or create a PR without explicit user instruction.
