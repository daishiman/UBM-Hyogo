# Implementation Guide — issue-655-d7-recovery-2nd-cycle

## Part 1: 中学生レベルの説明

1回目の7日間の見守りで、記録が途中で抜けました。このタスクは、なぜ抜けたかを調べて、必要なら直してから、もう一度7日間見守るための手順書です。

たとえば、夏休みの観察日記で何日か記録を忘れたとします。そのまま「全部観察できた」とは言えません。まず、なぜ忘れたのかを確認し、次は忘れない仕組みにして、2回目の観察日記を最初から分けて書きます。このタスクでも、1回目と2回目の記録が混ざらないように、2回目のファイル名には `recovery` を付けます。

## Part 2: Technical Contract

### Current State

- Workflow root: `docs/30-workflows/issue-655-d7-recovery-2nd-cycle/`
- State: `implemented-local-runtime-pending / IMPLEMENTED_LOCAL_RUNTIME_PENDING`
- Scope: implementation specification for Issue #655 recovery cycle
- Runtime boundary: D'+7 recovery collection is pending user approval
- Local status: PR-A scripts, workflow YAML, runbook, focused tests, and local verification evidence are present in this worktree

### PR-A Contract

PR-A implements recovery support but does not claim `pass_runtime_synced`.

| Target | Required change |
| --- | --- |
| `post-switch-monitor.ts` | Add `--recovery-mode` and required `--since` validation |
| `recovery-rootcause-helper.ts` | Generate read-only root-cause stub when parent summary JSON is missing |
| `cf-audit-log-7day-summary.yml` | Add `workflow_dispatch.inputs.recovery_mode` and `since` |
| `15-infrastructure-runbook.md` | Add D'+0 reset, retention, max-2-cycle, and code-freeze rules |

### PR-B Contract

PR-B is created only after D'+7 recovery evidence exists. It updates recovery
evidence files and SSOT ledgers to `pass_runtime_synced` only when
`actualSnapshots = 168`, `leakageHourlyClean = true`, and
`fallbackRateMean <= 0.05`.

### User-Gated Operations

The following are not executed without explicit user approval: `gh workflow run`,
commit, push, PR creation, GitHub Variables/Secrets mutation, production deploy,
and `pass_runtime_synced` promotion.
