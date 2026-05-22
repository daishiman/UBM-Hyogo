# Branch Protection Desired Contexts

GitHub branch protection GET results are the operational source of truth after a user-approved operation.
The JSON files in this directory are desired-state manifests for `required_status_checks.contexts`.

Use `apply.sh` only after explicit user approval:

```bash
bash .github/branch-protection/apply.sh dev
bash .github/branch-protection/apply.sh main
bash .github/branch-protection/apply.sh all
```

The apply script reads the current branch protection payload first, replaces the contexts list, enforces the CLAUDE.md governance invariants (`required_pull_request_reviews=null`, `enforce_admins=true`, `required_linear_history=true`, `lock_branch=false`), and preserves the remaining optional fields.
