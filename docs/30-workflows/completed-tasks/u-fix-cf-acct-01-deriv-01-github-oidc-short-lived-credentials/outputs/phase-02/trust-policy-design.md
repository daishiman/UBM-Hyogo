# Trust Policy Design

## Status

SPEC_CREATED

## Primary Provider

AWS STS is the primary intermediate IdP for DERIV-01. 1Password Connect and Cloudflare direct short-lived token APIs are alternatives only if a later PoC updates the canonical matrix across Phase 1-13 and aiworkflow-requirements in the same wave.

## Allowed Subjects

| Environment | Branch | Allowed GitHub OIDC Subject Pattern |
| --- | --- | --- |
| staging | `refs/heads/dev` | `repo:daishiman/UBM-Hyogo:ref:refs/heads/dev` plus `environment:staging` |
| production | `refs/heads/main` | `repo:daishiman/UBM-Hyogo:ref:refs/heads/main` plus `environment:production` |

## Denied Subjects

| Source | Reason |
| --- | --- |
| fork pull request | no deploy trust; `id-token: write` must not be granted |
| `pull_request_target` | forbidden for deploy credential issuance |
| wildcard branch / repo | violates least privilege |
| non-deploy jobs | no Cloudflare mutation responsibility |

## Credential Boundary

AWS STS guarantees the AWS session lifetime (`<= 3600s`). If Cloudflare does not provide a true per-job short-lived API token path, DERIV-01 target wording is GitHub Secret removal plus job-scoped retrieval through the AWS STS session, not a claim that the Cloudflare API Token object itself expires in one hour.
