# Regression Dry-Run

Status: `pending_user_gate`

The regression dry-run is required during implementation execution:

1. Temporarily change `apps/web/src/styles/tokens.css`.
2. Run admin visual baseline comparison in CI.
3. Confirm `admin-staging-visual-*` detects the screenshot diff.
4. Revert the temporary token change.

This file remains pending while the workflow is `implemented_local_runtime_pending`.
