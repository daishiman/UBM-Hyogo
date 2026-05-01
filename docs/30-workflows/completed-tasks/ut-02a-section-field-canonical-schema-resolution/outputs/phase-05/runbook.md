# Runbook

1. Create `metadata.ts`.
2. Generate `generated/static-manifest.json` from canonical schema source.
3. Add resolver injection to `builder.ts`.
4. Remove old label/kind/section heuristic fallback branches.
5. Run typecheck, lint, and repository tests.
6. If D1 columns are adopted, use `bash scripts/cf.sh` for migration commands.

