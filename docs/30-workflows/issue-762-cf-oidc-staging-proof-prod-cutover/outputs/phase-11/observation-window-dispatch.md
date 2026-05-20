# Observation Window Dispatch Evidence

Status: local static verification only.

The new workflow `.github/workflows/oidc-observation-window.yml` is intentionally `workflow_dispatch` only and has no `push` or `schedule` trigger. It grants only `contents: read` and does not grant `id-token: write`.

No GitHub Actions dispatch was executed in this cycle because commit, push, and remote workflow execution remain user-gated. Local evidence is:

- Workflow file exists.
- `grep -E "push:|schedule:|id-token" .github/workflows/oidc-observation-window.yml` returns no matches.
- The verifier job is a no-op placeholder and must be replaced with a real fallback-count verifier after Cloudflare OIDC deploy support is official.
