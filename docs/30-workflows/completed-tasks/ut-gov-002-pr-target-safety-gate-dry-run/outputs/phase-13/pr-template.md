# Phase 13 PR Template

## Title

docs(governance): UT-GOV-002 pull_request_target safety gate dry-run specification

## Summary

- Formalizes the parent task U-2 follow-up.
- Defines trusted/untrusted GitHub Actions boundaries.
- Adds dry-run specification matrix and failure cases.
- Keeps real workflow edits and dry-run execution in a downstream implementation task.

## Test Plan

- Validate workflow spec structure.
- Verify artifacts and output paths.
- Confirm no commit / push / PR is created before user approval.
