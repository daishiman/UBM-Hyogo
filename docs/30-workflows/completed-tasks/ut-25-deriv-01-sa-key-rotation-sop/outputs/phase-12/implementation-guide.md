# Implementation Guide

## Part 1: Middle School Explanation

A service account key is like a house key for the Sheets integration. We make a
new key, test it on the staging door first, then use it on the production door.
The old key is not thrown away immediately; it is kept briefly so in-flight work
does not break, then disabled, then deleted after a waiting period.

The important safety rule is that nobody writes the key itself on paper. The
operator records only where the key lives in 1Password and a short fingerprint.

## Part 2: Technical Detail

### 1. Architecture Overview

The helper wraps `scripts/cf.sh` and never calls `wrangler` directly. It accepts
secret values only from stdin, supports dry-run planning, and rotates the
canonical `GOOGLE_SERVICE_ACCOUNT_JSON` secret. The UT-26 smoke route now reads
`GOOGLE_SERVICE_ACCOUNT_JSON` first and falls back to the legacy
`GOOGLE_SHEETS_SA_JSON` alias only during migration.

### 2. Design Decisions

Production rotation is locked behind staging `put` plus staging `verify`. The
local state marker records only secret name, wrangler config, `op://` reference,
16 character fingerprint, and timestamps; it never stores JSON. Production must
reuse the same `op://` reference and fingerprint, and the state expires.

### 3. Risks

Cloudflare Secret values cannot be read back, so `secret list` proves only name
presence. Actual usability is proven by UT-26 Sheets smoke. Production smoke is
404 by default and requires temporary `SMOKE_SHEETS_ALLOW_PRODUCTION=true`
during a user-gated rotation window.

### 4. Operational Impact

Local verification is covered by bats and shellcheck. Real Cloudflare mutation,
Google IAM disable/delete, production smoke enablement, and UT-26
staging/production smoke are user-gated runtime operations outside this local
cycle. Operators must fill the rotation record template using the required
Japanese field names and link redacted UT-26 evidence.

### 5. Future Extensions

UT-25-DERIV-02 receives the new fingerprint for monitoring. UT-25-DERIV-03 owns
Cloudflare Secret audit log operations. UT-25-DERIV-04 remains the future
automation scope; this task keeps manual rotation reproducible and guarded.
