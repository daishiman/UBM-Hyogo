# Manual Smoke Log

| Check | Command | Result |
| --- | --- | --- |
| Current strict blocker | `pnpm lint:stablekey:strict` | FAIL expected: 148 violations, exit 1 |
| Command trace | `grep 'lint:stablekey:strict' package.json .github/workflows/ci.yml` | PARTIAL expected: package script exists, CI step intentionally absent |
| Branch protection main | `gh api repos/daishiman/UBM-Hyogo/branches/main/protection/required_status_checks` | PASS |
| Branch protection dev | `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection/required_status_checks` | PASS |

## Interpretation

The smoke result is not a runtime PASS for strict gate enablement. It is a safety gate proving that immediate CI YAML enforcement would break the required `ci` context.

