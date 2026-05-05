# Phase 6 Output: Failure Cases

Status: COMPLETED (enforced_dry_run review baseline).

Primary risks:

- allow-list path drift.
- false positive due to overbroad stableKey matching.
- false negative for static template literals.
- CI bypass if lint is not a required check.
- inline suppression weakening enforcement.

Policy: inline suppression baseline is 0; exceptions must be reviewed through allow-list or exception config.
