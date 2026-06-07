# 2026-06-06 issue-1111-proxy-transport-util-unify

- Registered `docs/30-workflows/completed-tasks/issue-1111-proxy-transport-util-unify/` as `implemented_local_evidence_captured / refactoring / NON_VISUAL`.
- Extracted the admin/public transport-selection idiom (service-binding 優先 → HTTP fallback) into a new pure util `apps/web/src/lib/fetch/transport-select.ts`（`resolveServiceBinding` / `stripTrailingSlash` / `selectAndFetch`）and switched the 3 call sites (`route.ts` / `server-fetch.ts` / `public.ts`) to it.
- Kept per-caller predicates as call-site state to preserve a pure refactor: `disableBinding` boolean, `resolveBase: () => string | null`, and opt-in `log`. `base-unavailable` branch is reachable only by `route.ts` (returns 500).
- `auth.ts` session-resolve (lightweight `service ?? { fetch }` variant) is intentionally out of scope — not the same 4-value idiom; merging it would break the pure refactor.
- Evidence: focused Vitest 6 files / 44 tests PASS, web typecheck PASS, web lint PASS, verify:phase12-compliance ok:true, gate-metadata ERROR 0.
- `apps/api` / D1 schema / Google Form / new endpoints unchanged. `LOCAL_DEV_FALLBACK` (127.0.0.1:8787) stays in `route.ts`; no 127.0.0.1 string is baked into the util (task-18 grep gate maintained).
- Added artifact inventory with inline lessons **L-I1111-001..007**; synchronized quick-reference / resource-map / task-workflow-active / topic-map / keywords (indexes:rebuild) / SKILL-changelog / SKILL.md / LOGS in the same wave. No dedicated lessons file (NON_VISUAL pure refactor; inventory-inline per issue-976 / issue-1094 precedent).
- Issue #1111 stays CLOSED (no mutation). Unassigned-task detection: current 0, baseline 1 (auth.ts — recorded only, not filed).
- commit, push, PR, staging smoke, and Issue mutation remain user-gated.
