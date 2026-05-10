# task-01 evidence index

| AC / gate | evidence file | result |
|---|---|---|
| G-01 | `evidence/yaml-syntax.log` | completed (exit 0, empty stdout) |
| G-02 | `evidence/actionlint.log` | completed (exit 0) |
| G-04 / AC-01 | `evidence/grep-gate.log` | completed (`CF_TOKEN_WORKERS` no match) |
| G-05 / AC-02 | `evidence/grep-gate.log` | completed (`secrets.CLOUDFLARE_API_TOKEN` count=2) |
| G-06 / AC-03 | `evidence/grep-gate.log` | completed (`Verify CF token is present` count=2) |
| G-07 / AC-06 | `evidence/secret-residue.log` | completed (no JWT-like token) |
| G-08 | `evidence/typecheck.log` | completed (`pnpm typecheck` exit 0) |
| G-09 | `evidence/lint.log` | completed (`pnpm lint` exit 0) |
| G-10 / AC-04 / AC-05 | `evidence/runtime-ci-pending.md` | runtime_pending (dev/main GitHub Actions require user-approved push/PR) |

Note: `*.log` evidence files are local-only because the repository ignores `*.log`. This tracked index records the command outcomes and expected counts for PR review. `outputs/artifacts.json` is not created for this subtask; root `artifacts.json` is the only artifact ledger.
