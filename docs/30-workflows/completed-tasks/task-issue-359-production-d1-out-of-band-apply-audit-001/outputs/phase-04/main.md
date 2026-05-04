# Phase 4 main

Status: SPEC_CREATED

This output materializes the audit verification strategy. The canonical detail remains `../../phase-04.md`.

## Summary

- AC-1 through AC-9 each have an evidence path or validation command.
- Redaction checks must scan generated outputs before close-out.
- Read-only checks require mutation command count 0; pre/post ledger row counts are used when local wrangler can retrieve the remote ledger, otherwise parent ledger snapshot + GitHub/git read-only transcript is the fallback evidence.
