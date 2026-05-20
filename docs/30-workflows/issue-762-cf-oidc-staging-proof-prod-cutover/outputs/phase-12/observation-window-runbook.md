# Observation Window Runbook

Current cycle:

1. Keep `.github/workflows/oidc-observation-window.yml` manual only.
2. Use `window_label` to identify the future observation window.
3. Do not grant `id-token: write`.
4. Do not treat the no-op workflow as proof of OIDC cutover.

Future real verifier:

- Count fallback usage of the legacy API token path.
- Compare deploy version / SHA between GitHub Actions and Cloudflare.
- Run `scripts/redaction-check.sh` on redacted deploy logs.
- Allow legacy token revocation only when fallback count is zero.
