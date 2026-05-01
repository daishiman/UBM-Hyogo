# Migration Runbook

Status: spec_created

Execution order:

1. Confirm current UT-04 schema baseline.
2. Run collision detection SQL for `(revision_id, stable_key)`.
3. Resolve any confirmed stable-key collisions before adding constraints.
4. Add back-fill progress state only if the implementation needs persisted cursor/status.
5. Add the partial UNIQUE index.
6. Verify `__extra__:*`, `unknown`, and NULL remain insertable where intended.

Use `bash scripts/cf.sh`; do not call `wrangler` directly in evidence.
