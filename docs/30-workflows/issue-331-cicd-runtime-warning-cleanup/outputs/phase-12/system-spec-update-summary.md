# System Spec Update Summary

## Updated

| File | Update |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | Web CD current facts now describe OpenNext Workers build plus `scripts/cf.sh deploy`; `CLOUDFLARE_API_TOKEN` is preserved as current runtime, while `CF_TOKEN_*` remains target contract. |
| `.claude/skills/aiworkflow-requirements/references/deployment-core.md` | Deployment flow now describes Workers deploy through `scripts/cf.sh`. |
| `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | `CLOUDFLARE_PAGES_PROJECT` is marked deprecated after Issue #331 cleanup. |

## No Change

- `deployment-cloudflare.md` retains broader Pages project history and ADR context.
- GitHub Secrets values were not read or mutated.
- Cloudflare dashboard resources were not changed.
