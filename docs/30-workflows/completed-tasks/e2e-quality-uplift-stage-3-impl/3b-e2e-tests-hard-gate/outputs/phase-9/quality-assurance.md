# Phase 9 — 品質保証 evidence

| 検証 | コマンド | 結果 |
|------|----------|------|
| typecheck | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | exit 0 |
| lint | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | exit 0 |
| YAML 構文 | `pnpm dlx @action-validator/cli .github/workflows/e2e-tests.yml` | exit 0 |
| shell 静的 | `shellcheck scripts/coverage-gate-e2e.sh` | violation 0 |
| `set -euo pipefail` | `head -3 scripts/coverage-gate-e2e.sh \| grep` | hit |
| しきい値根拠 | `grep 'quality-gates.md' scripts/coverage-gate-e2e.sh` | hit |
| job 名一致 | `grep -c 'e2e-tests-coverage-gate' .github/workflows/e2e-tests.yml` | ≥ 2 (`name:` + `jobs.e2e.name:`) |
