# Lessons Learned: task-staging-auth-secret-binding-recovery-001

## L-AUTHSECRET-001: `secret list` proves name presence, not usable value

Cloudflare `secret list` can show `AUTH_SECRET` while runtime still observes a
missing or blank binding. Treat list output as inventory evidence only. Value
usability must be proven by user-approved reinjection and runtime curl behavior.

## L-AUTHSECRET-002: Auth/config bodies should be classified before endpoint fixes

When runtime smoke returns `{"error":"auth misconfigured"}`, route handlers are
downstream of the failure. Check middleware and runtime bindings before editing
endpoint handlers.

## L-AUTHSECRET-003: Secret wrapper guards need a local dry-run path

`cf.sh secret put` can be tested without mutating Cloudflare by accepting
non-empty stdin under `--dry-run` and rejecting blank stdin before wrangler is
called.

