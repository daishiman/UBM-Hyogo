# Phase 2 Main

## Status

- workflow state: `spec_created`
- task type: `docs-only`

## Base Case

GHA schedule is the export and R2 upload main path because it can run `bash scripts/cf.sh d1 export`. Cloudflare cron triggers are limited to R2 latest-object healthcheck and UT-08 alerting.

## Boundary

This is a design artifact. No workflow YAML, Worker cron, R2 object, or secret has been created.
