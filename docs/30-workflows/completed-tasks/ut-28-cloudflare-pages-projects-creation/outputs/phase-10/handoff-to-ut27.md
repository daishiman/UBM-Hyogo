# UT-27 Handoff

## Purpose

UT-28 fixes the Cloudflare Pages project naming contract that UT-27 must use when placing GitHub Actions Variables.

## Variable Contract

| Item | Value |
| --- | --- |
| GitHub Variable | `CLOUDFLARE_PAGES_PROJECT` |
| Value | `ubm-hyogo-web` |
| Staging derivation | `web-cd.yml` appends `-staging` to the variable value |
| Production project | `ubm-hyogo-web` |
| Staging project | `ubm-hyogo-web-staging` |
| Do not set | `ubm-hyogo-web-staging` as the variable value |

## Verification Commands

```bash
rg -n "CLOUDFLARE_PAGES_PROJECT|project-name" .github/workflows/web-cd.yml
gh variable list | rg '^CLOUDFLARE_PAGES_PROJECT'
```

Expected result: the variable stores the production project name only, and the workflow derives staging by suffixing `-staging`.

## Timing

UT-27 may place the variable after UT-28 is accepted as the naming source. Actual Cloudflare Pages project creation and deploy smoke remain gated by Phase 13 user approval.
