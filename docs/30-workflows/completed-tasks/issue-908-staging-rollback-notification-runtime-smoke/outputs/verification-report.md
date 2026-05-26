# Verification Report — issue-908-staging-rollback-notification-runtime-smoke

## Run Summary

| Check | Command | Expected | Actual |
| --- | --- | --- | --- |
| helper syntax | `bash -n scripts/runtime-smoke/schema-alias-rollback.sh` | exit 0 | PASS |
| helper dry-run | `scripts/runtime-smoke/schema-alias-rollback.sh --env staging --alias ali_test_001 --scenario sent --dry-run` | exit 0 / no mutation | PASS |
| helper invalid alias guard | `bash scripts/runtime-smoke/schema-alias-rollback.sh --env staging --alias "bad'alias" --dry-run` | non-zero before URL/SQL construction | PASS（exit 1） |
| implementation guide validator | `node .claude/skills/task-specification-creator/scripts/validate-phase12-implementation-guide.js --workflow docs/30-workflows/issue-908-staging-rollback-notification-runtime-smoke --json` | `ok: true` | PASS |
| Phase 11 canonical paths | `node .claude/skills/task-specification-creator/scripts/validate-phase11-canonical-evidence-paths.js --workflow docs/30-workflows/issue-908-staging-rollback-notification-runtime-smoke --check-existence --json` | errors 0 | PASS |
| gate-metadata:validate | `mise exec -- pnpm gate-metadata:validate` | ERROR 0 | PASS: `OK: 443 WARN: 341 ERROR: 0` |
| verify:phase12-compliance | `mise exec -- pnpm verify:phase12-compliance` | status=pass | PASS |
| verify-pr-ready | `bash scripts/verify-pr-ready.sh` | all gates pass | FAIL: `indexes:rebuild drift`（index regenerated files are dirty and uncommitted; commit is user-gated） |
| typecheck | `mise exec -- pnpm typecheck` | exit 0 | PASS |
| lint | `mise exec -- pnpm lint` | exit 0 | PASS |
| indexes:rebuild | `mise exec -- pnpm indexes:rebuild` | exit 0 | PASS: topic-map / keywords regenerated |

## Results

本 cycle で実行済み。`mise` は `.mise.toml` untrusted warning を出したが、個別 validator は exit 0。

`bash scripts/verify-pr-ready.sh` は `verify:phase12-compliance` / `gate-metadata:validate` まで PASS し、`indexes:rebuild drift` で FAIL。aiworkflow-requirements の index regenerated files が未コミット差分として残っているためであり、commit は Phase 13 user-gated。

`git status --short` / `git diff --stat` も確認済み。差分は Issue #908 workflow、親 Issue #838 pending evidence cross-link、runtime smoke helper、task-specification-creator / aiworkflow-requirements の同一 wave skill sync に限定される。
