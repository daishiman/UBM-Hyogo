## Summary

- Align `.github/workflows/web-cd.yml` staging/production deploy jobs to the existing environment-scoped `secrets.CLOUDFLARE_API_TOKEN`.
- Add `Verify CF token is present` early-fail steps after `jdx/mise-action@v2` and before dependency install.
- Keep `scripts/cf.sh` unchanged so local 1Password-based deploy behavior remains intact.

## Evidence

- `outputs/phase-11/evidence/yaml-syntax.log`
- `outputs/phase-11/evidence/actionlint.log`
- `outputs/phase-11/evidence/grep-gate.log`
- `outputs/phase-11/evidence/secret-residue.log`
- `outputs/phase-11/evidence/typecheck.log`
- `outputs/phase-11/evidence/lint.log`
- `outputs/phase-11/evidence/runtime-ci-pending.md`

## Runtime Boundary

`dev` / `main` GitHub Actions runtime evidence, commit, push, and PR creation are user-gated. Local static evidence is captured; deploy runtime evidence remains `runtime_pending`.
