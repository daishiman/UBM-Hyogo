# Phase 9 Output: 品質保証

## Status

SPEC_CREATED_RUNTIME_PENDING

## Quality Gates

| Gate | Command / Check |
| --- | --- |
| typecheck | `pnpm typecheck` |
| lint | `pnpm lint` |
| shell syntax | `bash -n scripts/cf.sh` |
| workflow inventory | `rg -n 'CLOUDFLARE_API_TOKEN|id-token|wrangler' .github/workflows` |
| secret hygiene | zero match for token-like values in workflow outputs |
| indexes | `pnpm indexes:rebuild` followed by index drift review |

Runtime Cloudflare and GitHub API checks are intentionally pending user approval.

