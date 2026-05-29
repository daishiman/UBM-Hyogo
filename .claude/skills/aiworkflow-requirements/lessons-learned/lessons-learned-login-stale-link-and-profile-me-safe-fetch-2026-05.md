# Lessons Learned — login-stale-link-and-profile-me-safe-fetch

## L-LOGINSTALE-001: Implementation specs must not close with docs-only wording

When a workflow is `implementation / VISUAL_ON_EXECUTION`, Phase 12 must not mark PASS while code diff is absent. Either implement same-cycle code/tests or explicitly reclassify to docs-only.

## L-LOGINSTALE-002: Redirect normalization should accept unknown at the boundary

Next search params and client state helpers can receive object-shaped values through integration drift. The boundary helper should accept `unknown`, narrow to string, and fallback before URLSearchParams or template strings can stringify objects.

## L-LOGINSTALE-003: Safe fetch must wrap the first member data dependency

Wrapping `/me/profile` is insufficient when `/profile` first calls `/me`. The first data dependency must be protected, with only auth-required treated as a framework redirect.

## L-LOGINSTALE-004: VISUAL_ON_EXECUTION separates local code evidence from staging screenshots

Local focused tests can close Gate-A, while staging deploy and authenticated screenshots remain Gate-B user-gated. Phase 11 should record runtime pending instead of PASS.
