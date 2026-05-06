# Skill Feedback Report

## Template Improvement

Production extension specs should avoid saying that Workers secrets are declared in `wrangler.toml`. The template should say: vars are declared in `wrangler.toml`; secrets are verified and placed with `cf.sh secret list/put`.

## Workflow Improvement

When `artifacts.json` lists future runtime evidence files, create explicit `RUNTIME_PENDING_USER_APPROVAL` template files. This prevents manifest drift without treating planned evidence as runtime PASS.

## Documentation Improvement

`aiworkflow-requirements` should keep environment-scoped secret naming examples for same-name secrets such as `SENTRY_DSN_API`, `SLACK_WEBHOOK_INCIDENT`, and `SMOKE_ADMIN_TOKEN`, including production-specific approval gates.
