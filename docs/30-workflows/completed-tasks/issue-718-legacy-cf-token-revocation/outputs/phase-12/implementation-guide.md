# Implementation Guide

## Part 1 Junior Explanation

なぜ必要か: 古い Cloudflare token が残ると、漏えい時に広い権限で使われる危険が続くためです。

何をしたか: Issue #718 の実行用 workflow root、証跡テンプレート、Phase 12 strict outputs、正本同期を作りました。

たとえば、古い Cloudflare token は古い合鍵のようなものです。We should not throw it away until we know the new keys work everywhere. This workflow first checks where the old key is still mentioned, then waits for a human approval before removing it.

The important rule is simple: do not print or save secret values. We only write down names of commands, names of secrets, and whether the command succeeded. If a step could break deployment or recovery, it stays behind Gate C.

When Gate C is not approved, the correct result is "ready but not executed." That state protects both security and uptime.

### 今回作ったもの

- `docs/30-workflows/issue-718-legacy-cf-token-revocation/`
- `outputs/phase-11/evidence/*.md`
- `outputs/phase-12/{main,implementation-guide,phase12-task-spec-compliance-check,system-spec-update-summary,skill-feedback-report,unassigned-task-detection,documentation-changelog}.md`

## Part 2 Technical Summary

This is a NON_VISUAL governance workflow for retiring legacy `CLOUDFLARE_API_TOKEN` surfaces after Issue #640. It uses a three-gate model: Gate A for spec close, Gate B for git publication, and Gate C for external mutation.

`artifacts.json.metadata` declares `governance_mutation_user_gate: true`, separates read-only and mutation evidence ledgers, and keeps root state at `spec_created_runtime_gate_pending` until runtime evidence is captured.

The source unassigned task is consumed provenance. Reviewers should use this workflow root for execution evidence and approval records.

### TypeScript 型定義

```ts
type Issue718WorkflowState = "spec_created_runtime_gate_pending" | "completed";

interface Issue718EvidenceLedger {
  actual_read_only_evidence_files: string[];
  actual_mutation_evidence_files: string[];
  user_approval_marker: string;
}
```

### CLIシグネチャ

```bash
rg -n "CLOUDFLARE_API_TOKEN|CLOUDFLARE_API_TOKEN_STAGING" .github apps packages scripts docs .claude
gh secret list --env staging
gh secret list --env production
```

### 使用例

```bash
pnpm verify:phase12-compliance
```

### エラーハンドリング

If a current consumer remains, stop before Gate C and classify the consumer. If evidence contains secret material, discard the evidence and recapture a redacted summary. If user approval is missing, mutation commands are blocked.

### エッジケース

GitHub Issue #718 is closed, so PR text must use `Refs #718`. OIDC may complete before this workflow runs, which changes the inventory result but not the evidence rules. Generated indexes may keep historical references to the consumed source task.

### 設定項目と定数一覧

| Name | Value |
| --- | --- |
| `governance_mutation_user_gate` | `true` |
| `gateModel` | `three_gate_a_b_c` |
| `runtime_evidence_status` | `pending_gate_c` |

### テスト構成

| Test | Purpose |
| --- | --- |
| `validate-phase12-implementation-guide.js` | implementation guide content gate |
| `verify-all-specs.js` | Phase 1-13 structure gate |
| `verify:phase12-compliance` | changed workflow Phase 12 heading gate |

## Part 3 Preconditions

- Issue #640 step-scoped token cutover has staging and production runtime evidence.
- Legacy token consumers are fully inventoried and classified.
- Active workflow references to `secrets.CLOUDFLARE_API_TOKEN` are 0 before Gate C revocation.
- Operator confirms Cloudflare, GitHub, and 1Password mutation scope.

## Part 4 Execution Steps

1. Run read-only inventory.
2. Classify active consumers.
3. Confirm active `secrets.CLOUDFLARE_API_TOKEN` workflow references are 0.
4. Save Gate C approval marker.
5. Execute operator-approved revocation / deletion / 1Password update.
6. Capture redacted after evidence.
7. Update deployment secret inventory.

## Part 5 Verification Commands

```bash
test -f docs/30-workflows/issue-718-legacy-cf-token-revocation/artifacts.json
find docs/30-workflows/issue-718-legacy-cf-token-revocation/outputs/phase-12 -maxdepth 1 -type f | sort
node -e "JSON.parse(require('fs').readFileSync('docs/30-workflows/issue-718-legacy-cf-token-revocation/artifacts.json','utf8')); JSON.parse(require('fs').readFileSync('docs/30-workflows/issue-718-legacy-cf-token-revocation/outputs/artifacts.json','utf8'))"
rg -n "issue-718-legacy-cf-token-revocation|issue-640-followup-002" .claude/skills/aiworkflow-requirements docs/30-workflows/unassigned-task
```

## Part 6 Known Limits

This cycle does not revoke a real token. That is intentional because no explicit Gate C approval was provided. The workflow is ready for operator execution once runtime preconditions are green.

GitHub Issue #718 is already closed, so future PR text should use `Refs #718` rather than a closing keyword.

If Issue #640 runtime evidence is still pending, Gate C remains blocked even if this specification is complete.

## Part 7 Evidence Handling

Read-only evidence and mutation evidence are stored in separate ledgers. This prevents a reviewer from mistaking inventory templates for proof that a token was revoked. The mutation ledger remains empty until Gate C is approved and executed.

Read-only evidence can be refreshed without mutating external systems.

Mutation evidence must include the saved approval marker path.

## Part 8 Roll-Forward Plan

If the legacy token cannot be revoked because an active consumer remains, do not force deletion. Classify the consumer and migrate it to a step-scoped or OIDC-backed path first. Then return to Gate C with fresh inventory evidence showing 0 active `secrets.CLOUDFLARE_API_TOKEN` workflow references.

This is a roll-forward path, not a rollback to broad long-lived credentials.

Any new consumer migration should be linked from the Phase 12 unassigned-task report if it cannot be completed in the same approved Gate C wave.

## Part 9 Redaction Review

Before any evidence is committed, scan it for token values, token previews, suffixes, account IDs, vault values, and stable hashes. Evidence should contain only command names, exit codes, secret names, item names, and high-level statuses. Any leaked secret material invalidates the evidence.

Do not paste Cloudflare dashboard screenshots that expose identifiers.

Prefer manually written redacted summaries over raw logs when raw logs contain sensitive context.

## Part 10 System Spec Sync

`deployment-secrets-management.md` is the canonical inventory surface for this workflow. Quick reference, resource map, and task workflow active entries point reviewers back to the canonical Issue #718 root. The source unassigned task remains as consumed provenance.

The system spec must not claim revocation completion until Gate C evidence exists.

Generated or historical references may still mention the source unassigned task as provenance.

## Part 11 Close-Out Criteria

Gate A is closed when the workflow root, artifacts, Phase 11 read-only evidence/templates, Phase 12 strict outputs, and aiworkflow references exist. Gate C is closed only after explicit approval, external mutation, after evidence, and health checks are saved. The root workflow state must not become `completed` before Gate C evidence exists.

Gate B commit / push / PR remains separately user-gated.

If Gate C is later executed, update `actual_mutation_evidence_files` in both artifact ledgers in the same wave.
