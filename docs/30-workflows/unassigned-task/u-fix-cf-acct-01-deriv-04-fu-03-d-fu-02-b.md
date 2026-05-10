# U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-FU-02-B: Automatic Rotation Scheduler

## 苦戦箇所

Issue #587 defines manual canary and promotion gates. Adding cron-based automatic rotation in the same cycle would bypass the deliberate Gate-R0 to Gate-R3 approval boundary.

## リスクと対策

| リスク | 対策 |
| --- | --- |
| scheduled rotation runs without a fresh candidate | scheduler must require explicit candidate op reference and gate artifact |
| promotion happens without owner review | keep promotion as PR-only and user-approved |
| repeated failures create alert noise | add dedupe and backoff before enabling schedule |

## 検証方法

- Dry-run scheduled workflow with no candidate and confirm fail-closed.
- Dry-run with candidate reference and verify canary-only behavior.
- Confirm no production op reference is changed by schedule.

## スコープ

Includes cron/workflow scheduling design and dry-run checks. Excludes production promotion mutation.

