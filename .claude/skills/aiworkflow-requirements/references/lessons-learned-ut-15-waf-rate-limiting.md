# Lessons Learned: UT-15 WAF / Rate Limiting

## L-UT15-001 Thresholds Need Observation

Initial thresholds are only a starting point. Use Cloudflare Analytics and Security Events for a
seven-day Simulate window before Enforce.

## L-UT15-002 Edge And App Limits Have Different Jobs

Edge rate limiting blocks bursty IP behavior. App-layer rate limiting protects business logic such
as per-email Magic Link enumeration. Keep `reason: "edge" | "app"` visible in 429 evidence.

## L-UT15-003 Dry-run Must Not Become False Green

Until Cloudflare Rulesets API write support is implemented, non-dry-run `cf-waf-apply.sh` must fail
closed. A local `done.` message without mutation would make Phase 13 evidence unsafe.

## L-UT15-004 Free Plan Capacity Is A Design Constraint

Custom Rules must stay within the free-plan rule count. Pro / OWASP CRS / Bot Management decisions
belong in a future governance task, not in the MVP apply path.

## L-UT15-005 Public Route Groups Are Not URL Literals

Next.js route-group notation such as `(public)` is not a runtime URL segment. Cloudflare expressions
must target `/api/public/...` or the actual deployed path.
