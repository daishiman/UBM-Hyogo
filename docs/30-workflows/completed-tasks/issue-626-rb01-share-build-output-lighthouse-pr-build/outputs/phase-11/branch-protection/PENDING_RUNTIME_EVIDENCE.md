# Pending Branch Protection Runtime Evidence

Read-only current branch protection JSON is captured in:

- `dev-current.json`
- `main-current.json`

The merge-time before/after diff requires a user-approved PR merge and is therefore pending:

- `dev-before.json`
- `dev-after.json`
- `main-before.json`
- `main-after.json`
- `diff.txt`

Current read-only evidence shows `lighthouse-ci` is the required context on both `dev` and `main`. `build-test` is preserved as the `needs` dependency of `lighthouse-ci` in `.github/workflows/pr-build-test.yml`.
