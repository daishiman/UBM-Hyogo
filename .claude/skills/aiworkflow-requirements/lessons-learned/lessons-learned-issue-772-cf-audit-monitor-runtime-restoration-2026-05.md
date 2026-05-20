# Lessons learned: Issue #772 CF audit monitor runtime restoration

## L-ISSUE772-001: Closed cleanup issue can hide runtime restoration work

If a closed cleanup issue assumes prior runtime stability, re-check current workflow failures and secret / variable inventory before preserving the original classification.

## L-ISSUE772-002: Cleanup no-op and runtime restored are separate states

Production environment monitor secrets can be absent while the monitor is still failing. Use cleanup no-op decision for the inventory result and keep runtime restoration pending until dry run plus scheduled success evidence exists.

## L-ISSUE772-003: Repo-level variable count must exclude existing account id explicitly

`cf-audit-log-monitor.yml` references nine variables, but `CLOUDFLARE_ACCOUNT_ID` can already exist at repo level. State both facts: eight variables require mirror planning, one is confirmed existing.

## L-ISSUE772-004: Rollback delete commands are destructive gates

`gh secret delete` and `gh api -X DELETE /actions/variables/<name>` require their own explicit user approval marker even when described as rollback.

