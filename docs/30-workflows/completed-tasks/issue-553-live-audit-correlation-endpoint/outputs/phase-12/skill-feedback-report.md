# Skill Feedback Report

## テンプレ改善

- Runtime-evidence-heavy implementation specs need a first-class wording pattern for `RESERVED_RUNTIME_EVIDENCE_PENDING`, distinct from actual runtime PASS states.
- Phase 12 templates should reject `documentation-update-history.md` and `skill-feedback.md` aliases during spec creation, not only during close-out.
- Phase 12 review should hard-fail when `apps/` / `packages/` diffs exist but the workflow ledger still says `spec_created` / `implementation_pending`; the reviewer must either reclassify to implemented-local or remove the code wave.

## ワークフロー改善

- Live Cloudflare Worker wiring tasks should include an early table for route / scheduled / D1 / Slack / secret ownership and whether each item is spec-only or runtime evidence.
- Phase 13 PR templates should include a spec_created variant and an implementation wave variant to avoid false `[x]` evidence checkboxes.
- Workflow deletion / archive moves need a reference integrity gate: `git diff --diff-filter=D --name-only docs/30-workflows` must be reconciled with active guide, unassigned-task pointers, indexes, and artifact inventories before PASS.
- Phase docs should include a contract drift gate that compares CLI examples, route auth headers, CI trigger paths, and implemented script flags against the actual files.

## ドキュメント改善

- aiworkflow-requirements audit-correlation SSOT should keep fixture boundary (#516) and live wiring formalization (#553) in separate sections.
- Workflows with `outputs/artifacts.json` should copy the explicit `cmp -s artifacts.json outputs/artifacts.json` parity sentence into compliance checks.
- Security automation specs should promote the concrete redaction grep patterns from Phase 4 into the CI workflow or a shared script invocation, rather than documenting broader patterns than CI actually enforces.
